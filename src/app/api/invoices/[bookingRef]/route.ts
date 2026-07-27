import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingRef: string }> }
) {
  try {
    const supabase = supabaseAdmin

    const { bookingRef } = await params

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        events (
          title,
          host_id,
          start_datetime,
          location_id
        ),
        booking_items (
          quantity,
          unit_price,
          subtotal,
          ticket_tiers (
            name
          )
        )
      `)
      .eq('booking_ref', bookingRef)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, invoice: booking })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
