'use server'

import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

type AppSupabaseClient = SupabaseClient<Database>

const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || 'fallback-secret-for-dev'

type CheckInResponse = {
  status: 'success' | 'already_checked_in' | 'invalid' | 'error'
  message?: string
  holder_name?: string | null
  ticket_number?: string
  checked_in_at?: string | null
}

interface TicketCheckInData {
  id: string
  ticket_number: string
  event_id: string
  is_checked_in: boolean
  checked_in_at: string | null
  is_void: boolean
  holder_name: string | null
  events: {
    host_id: string
  } | null
}

export async function verifyTicketAction(qrCodeData: string, expectedEventId: string): Promise<CheckInResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
    
    if (authError || !user) {
      return { status: 'error', message: 'Unauthorized' }
    }

    // Parse: ticketId:signature
    const [ticketId, signature] = qrCodeData.split(':')
    
    if (!ticketId || !signature) {
       return { status: 'invalid', message: 'Invalid QR format' }
    }

    // Verify HMAC
    const expectedSignature = createHmac('sha256', QR_HMAC_SECRET)
      .update(ticketId)
      .digest('hex')

    if (expectedSignature !== signature) {
      return { status: 'invalid', message: 'Security verification failed' }
    }

    // Fetch ticket and verify ownership and event match
    const { data: ticketResult, error: ticketError } = await (supabase as AppSupabaseClient)
      .from('tickets')
      .select(`
        id, 
        ticket_number, 
        event_id, 
        is_checked_in, 
        checked_in_at, 
        is_void, 
        holder_name,
        events (
          host_id
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticketResult) {
      return { status: 'invalid', message: 'Ticket not found' }
    }

    const ticket = ticketResult as unknown as TicketCheckInData
    const eventHostId = ticket.events?.host_id

    // Verify user is the host
    if (eventHostId !== user.id) {
       return { status: 'invalid', message: 'Unauthorized: You are not the host of this event' }
    }

    // Verify event ID matches
    if (ticket.event_id !== expectedEventId) {
       return { status: 'invalid', message: 'Ticket is for a different event' }
    }

    if (ticket.is_void) {
      return { status: 'invalid', message: 'Ticket has been voided' }
    }

    if (ticket.is_checked_in) {
      return { status: 'already_checked_in', checked_in_at: ticket.checked_in_at }
    }

    // Update ticket
    const { error: updateError } = await (supabase as AppSupabaseClient)
      .from('tickets')
      .update({
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id
      })
      .eq('id', ticketId)

    if (updateError) {
      return { status: 'error', message: 'Failed to update check-in status' }
    }

    return { 
      status: 'success', 
      holder_name: ticket.holder_name, 
      ticket_number: ticket.ticket_number 
    }
  } catch (error: unknown) {
    console.error('Check-in error:', error)
    return { status: 'error', message: 'An unexpected error occurred during check-in' }
  }
}

export async function checkInByTicketNumberAction(ticketNumber: string, expectedEventId: string): Promise<CheckInResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
    
    if (authError || !user) {
      return { status: 'error', message: 'Unauthorized' }
    }

    // Fetch ticket by ticket_number
    const { data: ticketResult, error: ticketError } = await (supabase as AppSupabaseClient)
      .from('tickets')
      .select(`
        id, 
        ticket_number, 
        event_id, 
        is_checked_in, 
        checked_in_at, 
        is_void, 
        holder_name,
        events (
          host_id
        )
      `)
      .eq('ticket_number', ticketNumber)
      .single()

    if (ticketError || !ticketResult) {
      return { status: 'invalid', message: 'Ticket not found' }
    }

    const ticket = ticketResult as unknown as TicketCheckInData
    const eventHostId = ticket.events?.host_id

    if (eventHostId !== user.id) {
       return { status: 'invalid', message: 'Unauthorized: You are not the host of this event' }
    }

    if (ticket.event_id !== expectedEventId) {
       return { status: 'invalid', message: 'Ticket is for a different event' }
    }

    if (ticket.is_void) {
      return { status: 'invalid', message: 'Ticket has been voided' }
    }

    if (ticket.is_checked_in) {
      return { status: 'already_checked_in', checked_in_at: ticket.checked_in_at }
    }

    // Update ticket
    const { error: updateError } = await (supabase as AppSupabaseClient)
      .from('tickets')
      .update({
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id
      })
      .eq('id', ticket.id)

    if (updateError) {
      return { status: 'error', message: 'Failed to update check-in status' }
    }

    return { 
      status: 'success', 
      holder_name: ticket.holder_name, 
      ticket_number: ticket.ticket_number 
    }
  } catch (error: unknown) {
    console.error('Manual check-in error:', error)
    return { status: 'error', message: 'An unexpected error occurred during manual check-in' }
  }
}

export async function getEventCheckInStatsAction(eventId: string) {
  try {
    const supabase = await createClient()
    
    // Get total tickets (confirm/checked in)
    const { count: total, error: totalError } = await (supabase as AppSupabaseClient)
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('is_void', false)

    // Get checked in count
    const { count: checkedIn, error: checkedInError } = await (supabase as AppSupabaseClient)
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('is_checked_in', true)
      .eq('is_void', false)

    if (totalError || checkedInError) {
      console.error('Stats error:', totalError || checkedInError)
      return { total: 0, checkedIn: 0 }
    }

    return { total: total || 0, checkedIn: checkedIn || 0 }
  } catch (error: unknown) {
    console.error('Stats fetch error:', error)
    return { total: 0, checkedIn: 0 }
  }
}
