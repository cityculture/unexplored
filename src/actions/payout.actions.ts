'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export async function requestPayoutAction(eventId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify user is host of the event
    const { data: event, error: eventError } = await (supabase as AppSupabaseClient)
      .from('events')
      .select('id, host_id, status, end_datetime')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { error: 'Event not found' }
    }

    if (event.host_id !== user.id) {
      return { error: 'Unauthorized: Not the host of this event' }
    }

    if (new Date(event.end_datetime) > new Date()) {
      return { error: 'Event has not ended yet' }
    }

    // Check no existing payout
    const { data: existingPayout } = await (supabase as AppSupabaseClient)
      .from('payouts')
      .select('id, status')
      .eq('event_id', eventId)
      .in('status', ['pending', 'processing', 'paid'])
      .maybeSingle()

    if (existingPayout) {
      return { error: `Payout request already exists with status: ${existingPayout.status}` }
    }

    // Calculate sum of confirmed bookings
    const { data: bookings, error: bookingsError } = await (supabase as AppSupabaseClient)
      .from('bookings')
      .select('taxable_amount, platform_fee, gst_on_fee, host_payout')
      .eq('event_id', eventId)
      .eq('status', 'confirmed')

    if (bookingsError) {
      return { error: 'Failed to fetch bookings' }
    }

    if (!bookings || bookings.length === 0) {
      return { error: 'No confirmed bookings found for this event' }
    }

    const gross_amount = bookings.reduce((sum: number, b) => sum + Number(b.taxable_amount), 0)
    const platform_fee = bookings.reduce((sum: number, b) => sum + Number(b.platform_fee), 0)
    const gst_on_fee = bookings.reduce((sum: number, b) => sum + Number(b.gst_on_fee), 0)
    const net_amount = bookings.reduce((sum: number, b) => sum + Number(b.host_payout), 0)

    const { data: newPayout, error: insertError } = await (supabase as AppSupabaseClient)
      .from('payouts')
      .insert({
        host_id: user.id,
        event_id: eventId,
        payout_type: 'event_settlement',
        gross_amount,
        platform_fee,
        gst_on_fee,
        net_amount,
        status: 'pending',
        currency: 'INR'
      })
      .select()
      .single()

    if (insertError) {
      return { error: 'Failed to create payout: ' + insertError.message }
    }

    // Audit log
    await (supabase as AppSupabaseClient).from('audit_logs').insert({
      actor_id: user.id,
      action: 'payout.requested',
      entity_type: 'payout',
      entity_id: newPayout.id,
      metadata: { event_id: eventId }
    })

    return { success: true, payout: newPayout }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unexpected error' }
  }
}
