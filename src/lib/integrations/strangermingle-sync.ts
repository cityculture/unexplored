import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'

const SM_SUPABASE_URL = process.env.STRANGERMINGLE_SUPABASE_URL || 'https://uuanzogrkoomekskvxab.supabase.co'
const SM_SERVICE_ROLE_KEY = process.env.STRANGERMINGLE_SUPABASE_SERVICE_ROLE_KEY

function getStrangerMingleAdmin() {
  if (!SM_SERVICE_ROLE_KEY) {
    console.warn('[SM Sync] STRANGERMINGLE_SUPABASE_SERVICE_ROLE_KEY is not configured')
    return null
  }
  return createClient(SM_SUPABASE_URL, SM_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

/**
 * Whenever a booking is confirmed on City Culture, if the event was imported
 * from Stranger Mingle, this function automatically increments the sold_count
 * for the corresponding ticket tier in Stranger Mingle to reduce available inventory.
 */
export async function syncTicketSaleToStrangerMingle(bookingId: string) {
  try {
    const smClient = getStrangerMingleAdmin()
    if (!smClient) return { success: false, error: 'SM client not configured' }

    // 1. Fetch booking details from City Culture
    const { data: booking, error: bErr } = await (supabaseAdmin as any)
      .from('bookings')
      .select(`
        id,
        event_id,
        status,
        event:events (
          id,
          title,
          external_source,
          external_event_id
        ),
        booking_items (
          id,
          quantity,
          ticket_tier_id,
          ticket_tier:ticket_tiers (
            id,
            name,
            external_tier_id
          )
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) {
      console.error('[SM Sync] Failed to fetch booking details for inventory reduction:', bErr)
      return { success: false, error: bErr?.message || 'Booking not found' }
    }

    const event = booking.event
    if (event?.external_source !== 'strangermingle' || !event?.external_event_id) {
      // Not a Stranger Mingle event, nothing to sync
      return { success: true, skipped: true }
    }

    console.log(`[SM Sync] Syncing ticket sale for SM Event "${event.title}" (SM ID: ${event.external_event_id})...`)

    let totalTicketsQuantity = 0

    // 2. Decrement inventory (increment sold_count) for each tier in Stranger Mingle
    for (const item of (booking.booking_items || [])) {
      const externalTierId = item.ticket_tier?.external_tier_id
      const quantity = item.quantity || 1
      totalTicketsQuantity += quantity

      if (!externalTierId) {
        console.warn(`[SM Sync] No external_tier_id found for tier ${item.ticket_tier?.name}`)
        continue
      }

      // Fetch current sold_count on Stranger Mingle
      const { data: smTier, error: tierFetchErr } = await smClient
        .from('ticket_tiers')
        .select('id, name, sold_count, total_quantity')
        .eq('id', externalTierId)
        .single()

      if (tierFetchErr || !smTier) {
        console.error(`[SM Sync] Failed to fetch tier on Stranger Mingle (ID: ${externalTierId}):`, tierFetchErr)
        continue
      }

      const newSoldCount = (smTier.sold_count || 0) + quantity

      const { error: tierUpdateErr } = await smClient
        .from('ticket_tiers')
        .update({
          sold_count: newSoldCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', externalTierId)

      if (tierUpdateErr) {
        console.error(`[SM Sync] Failed to update sold_count for tier ${smTier.name}:`, tierUpdateErr)
      } else {
        console.log(`[SM Sync] Successfully updated SM Tier "${smTier.name}": sold_count ${smTier.sold_count} -> ${newSoldCount} (Remaining: ${smTier.total_quantity - newSoldCount})`)
      }
    }

    // 3. Increment booking_count on Stranger Mingle's event
    const { data: smEvent } = await smClient
      .from('events')
      .select('id, booking_count')
      .eq('id', event.external_event_id)
      .single()

    if (smEvent) {
      await smClient
        .from('events')
        .update({
          booking_count: (smEvent.booking_count || 0) + totalTicketsQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.external_event_id)
    }

    return { success: true }
  } catch (err: any) {
    console.error('[SM Sync] Error in syncTicketSaleToStrangerMingle:', err)
    return { success: false, error: err.message }
  }
}
