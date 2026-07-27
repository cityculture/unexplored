import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  try {
    const supabase = supabaseAdmin

    const { ticketNumber } = await params

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        ticket_number,
        holder_name,
        is_checked_in,
        bookings!inner (
          user_id
        ),
        events (
          title,
          start_datetime
        )
      `)
      .eq('ticket_number', ticketNumber)
      .single()

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const result = {
      ticket_number: ticket.ticket_number,
      event_title: ticket.events?.title,
      start_datetime: ticket.events?.start_datetime,
      holder_name: ticket.holder_name,
      is_checked_in: ticket.is_checked_in
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
