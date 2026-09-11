import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'

const SM_SUPABASE_URL = process.env.STRANGERMINGLE_SUPABASE_URL || 'https://uuanzogrkoomekskvxab.supabase.co'
const SM_SERVICE_ROLE_KEY = process.env.STRANGERMINGLE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YW56b2dya29vbWVrc2t2eGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAxNzcxMywiZXhwIjoyMDg4NTkzNzEzfQ.7nikLlaSNSRB0KZsfMgFMa-rLgy0YzZv-27-ElJshng'

const SALTY_SUPABASE_URL = process.env.SALTY_SUPABASE_URL || 'https://dwizjplnmxlyhkbxbosw.supabase.co'
const SALTY_SERVICE_ROLE_KEY = process.env.SALTY_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpqcGxubXhseWhrYnhib3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUxNDE1OSwiZXhwIjoyMDc1MDkwMTU5fQ.ch95cmmFDF4lU5Uwp0TcDd-5UhI92MdZSXsxnnqyu3U'

function getClient(url: string, key?: string) {
  if (!key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Whenever a booking is confirmed on City Culture, if the event was imported
 * from a partner (Stranger Mingle or Salty Media), this function automatically
 * updates the sold_count / booked_count on the partner's database.
 */
export async function syncTicketSaleToExternalSource(bookingId: string) {
  try {
    // 1. Fetch booking details from City Culture
    const { data: booking, error: bErr } = await (supabaseAdmin as any)
      .from('bookings')
      .select(`
        id,
        booking_ref,
        event_id,
        attendee_name,
        attendee_email,
        attendee_phone,
        total_amount,
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
      console.error('[Inventory Sync] Failed to fetch booking details:', bErr)
      return { success: false, error: bErr?.message || 'Booking not found' }
    }

    const event = booking.event
    if (!event?.external_source || !event?.external_event_id) {
      // Internal event, nothing to sync
      return { success: true, skipped: true }
    }

    const source = event.external_source
    console.log(`[Inventory Sync] Syncing ticket sale for ${source} Event "${event.title}" (External ID: ${event.external_event_id})...`)

    let totalTicketsQuantity = 0

    if (source === 'strangermingle') {
      const smClient = getClient(SM_SUPABASE_URL, SM_SERVICE_ROLE_KEY)
      if (!smClient) return { success: false, error: 'Stranger Mingle client not configured' }

      for (const item of booking.booking_items || []) {
        const externalTierId = item.ticket_tier?.external_tier_id
        const quantity = item.quantity || 1
        totalTicketsQuantity += quantity

        if (!externalTierId) continue

        const { data: smTier } = await smClient
          .from('ticket_tiers')
          .select('id, name, sold_count, total_quantity')
          .eq('id', externalTierId)
          .single()

        if (smTier) {
          const newSoldCount = (smTier.sold_count || 0) + quantity
          await smClient
            .from('ticket_tiers')
            .update({ sold_count: newSoldCount, updated_at: new Date().toISOString() })
            .eq('id', externalTierId)
          console.log(`[Inventory Sync] Updated SM Tier "${smTier.name}": sold_count -> ${newSoldCount}`)
        }
      }

      // Increment booking_count on Stranger Mingle event
      const { data: smEvent } = await smClient.from('events').select('id, booking_count').eq('id', event.external_event_id).single()
      if (smEvent) {
        await smClient
          .from('events')
          .update({
            booking_count: (smEvent.booking_count || 0) + totalTicketsQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.external_event_id)
      }
      return { success: true }
    } else if (source === 'saltymedia') {
      const saltyClient = getClient(SALTY_SUPABASE_URL, SALTY_SERVICE_ROLE_KEY)
      if (!saltyClient) return { success: false, error: 'Salty Media client not configured' }

      for (const item of booking.booking_items || []) {
        const externalTierId = item.ticket_tier?.external_tier_id
        const quantity = item.quantity || 1
        totalTicketsQuantity += quantity

        if (!externalTierId) continue

        const { data: saltyTier } = await saltyClient
          .from('ticket_tiers')
          .select('id, tier_name, booked_count, total_capacity')
          .eq('id', externalTierId)
          .single()

        if (saltyTier) {
          const newBookedCount = (saltyTier.booked_count || 0) + quantity
          await saltyClient
            .from('ticket_tiers')
            .update({ booked_count: newBookedCount, updated_at: new Date().toISOString() })
            .eq('id', externalTierId)
          console.log(`[Inventory Sync] Updated Salty Tier "${saltyTier.tier_name}": booked_count -> ${newBookedCount}`)
        }
      }

      return { success: true }
    }

    return { success: true, skipped: true }
  } catch (err: any) {
    console.error('[Inventory Sync] Error:', err)
    return { success: false, error: err.message }
  }
}
