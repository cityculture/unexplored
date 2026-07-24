'use server'

import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

type AppSupabaseClient = SupabaseClient<Database>

const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || 'fallback-secret-for-dev'

export type TicketWithDetails = Database['public']['Tables']['tickets']['Row'] & {
  bookings: {
    attendee_name: string
    attendee_email: string
    attendee_phone: string | null
  } | null
  events: {
    title: string
    host_id: string
  } | null
}

export type TicketLookupResponse = {
  status: 'success' | 'invalid' | 'already_checked_in' | 'error'
  message?: string
  ticket?: TicketWithDetails
}

/**
 * Looks up a ticket by QR code data or ticket number.
 * Does NOT perform check-in, just returns details for review.
 */
export async function getTicketDetailsAction(
  identifier: string,
  eventId: string,
  type: 'qr' | 'manual' = 'qr'
): Promise<TicketLookupResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()

    if (authError || !user) {
      return { status: 'error', message: 'Unauthorized' }
    }

    let ticketId = identifier

    if (type === 'qr') {
      const [id, signature] = identifier.split(':')
      if (!id || !signature) {
        return { status: 'invalid', message: 'Invalid QR format' }
      }

      const expectedSignature = createHmac('sha256', QR_HMAC_SECRET)
        .update(id)
        .digest('hex')

      if (expectedSignature !== signature) {
        return { status: 'invalid', message: 'Security verification failed' }
      }
      ticketId = id
    }

    const query = (supabase as AppSupabaseClient)
      .from('tickets')
      .select(`
        *,
        bookings (
          attendee_name,
          attendee_email,
          attendee_phone
        ),
        events (
          title,
          host_id
        )
      `)

    const { data: ticket, error } = type === 'qr' 
      ? await query.eq('id', ticketId).single()
      : await query.eq('ticket_number', identifier).eq('event_id', eventId).single()

    if (error || !ticket) {
      return { status: 'invalid', message: 'Ticket not found' }
    }

    const typedTicket = ticket as unknown as TicketWithDetails

    // Verify host ownership (or co-host)
    // For simplicity, checking primary host first. Co-host check can be added if needed.
    if (typedTicket.events?.host_id !== user.id) {
       // Check co-hosts
       const { data: cohost } = await (supabase as AppSupabaseClient)
        .from('event_cohosts')
        .select('id')
        .eq('event_id', typedTicket.event_id)
        .eq('host_user_id', user.id)
        .eq('is_confirmed', true)
        .single()

       if (!cohost) {
         return { status: 'invalid', message: 'Unauthorized: You are not a host for this event' }
       }
    }

    if (typedTicket.event_id !== eventId) {
      return { status: 'invalid', message: 'This ticket is for a different event' }
    }

    if (typedTicket.is_void) {
      return { status: 'invalid', message: 'Ticket has been voided' }
    }

    if (typedTicket.is_checked_in) {
      return { status: 'already_checked_in', ticket: typedTicket }
    }

    return { status: 'success', ticket: typedTicket }
  } catch (error) {
    console.error('getTicketDetailsAction error:', error)
    return { status: 'error', message: 'Failed to fetch ticket details' }
  }
}

/**
 * Fetches all confirmed tickets for an event for manual list selection.
 */
export async function getEventTicketsAction(eventId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: event, error: eventError } = await (supabase as AppSupabaseClient)
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      throw new Error('Event not found')
    }

    if (event.host_id !== user.id) {
       // Check co-hosts
       const { data: cohost } = await (supabase as AppSupabaseClient)
        .from('event_cohosts')
        .select('id')
        .eq('event_id', eventId)
        .eq('host_user_id', user.id)
        .eq('is_confirmed', true)
        .single()

       if (!cohost) {
         throw new Error('Unauthorized: You are not a host for this event')
       }
    }

    const { data: tickets, error } = await (supabase as AppSupabaseClient)
      .from('tickets')
      .select(`
        id,
        ticket_number,
        holder_name,
        is_checked_in,
        is_void,
        bookings (
          attendee_name,
          attendee_phone
        )
      `)
      .eq('event_id', eventId)
      .eq('is_void', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { status: 'success', tickets }
  } catch (error) {
    console.error('getEventTicketsAction error:', error)
    return { status: 'error', message: 'Failed to fetch event tickets' }
  }
}

/**
 * Processes the attendance decision (Allowed or Denied).
 */
export async function processAttendanceAction(params: {
  ticketId: string
  eventId: string
  status: 'allowed' | 'denied'
  denialReason?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()

    if (authError || !user) {
      return { status: 'error', message: 'Unauthorized' }
    }

    // Verify host ownership (or co-host)
    const { data: ticket, error: ticketError } = await (supabase as AppSupabaseClient)
      .from('tickets')
      .select('event_id, events(host_id)')
      .eq('id', params.ticketId)
      .single()

    if (ticketError || !ticket) {
      return { status: 'error', message: 'Ticket not found' }
    }

    const typedTicket = ticket
    if (typedTicket.events?.host_id !== user.id) {
       // Check co-hosts
       const { data: cohost } = await (supabase as AppSupabaseClient)
        .from('event_cohosts')
        .select('id')
        .eq('event_id', typedTicket.event_id)
        .eq('host_user_id', user.id)
        .eq('is_confirmed', true)
        .single()

       if (!cohost) {
         return { status: 'error', message: 'Unauthorized: You are not a host for this event' }
       }
    }

    if (typedTicket.event_id !== params.eventId) {
      return { status: 'error', message: 'Event ID mismatch' }
    }

    // 1. Log the attempt
    const { error: logError } = await (supabase as AppSupabaseClient)
      .from('attendance_logs')
      .insert({
        ticket_id: params.ticketId,
        event_id: params.eventId,
        host_id: user.id,
        status: params.status,
        denial_reason: params.denialReason || null
      })

    if (logError) {
      console.error('Log error:', logError)
      return { status: 'error', message: 'Failed to log attendance' }
    }

    // 2. If allowed, mark ticket as checked in
    if (params.status === 'allowed') {
      const { error: ticketError } = await (supabase as AppSupabaseClient)
        .from('tickets')
        .update({
          is_checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: user.id
        })
        .eq('id', params.ticketId)

      if (ticketError) {
        console.error('Ticket update error:', ticketError)
        return { status: 'error', message: 'Failed to mark ticket as checked in' }
      }
    }

    return { status: 'success', message: params.status === 'allowed' ? 'Entry allowed successfully' : 'Entry denied logged' }
  } catch (error: unknown) {
    console.error('processAttendanceAction error:', error)
    return { status: 'error', message: 'An unexpected error occurred' }
  }
}
