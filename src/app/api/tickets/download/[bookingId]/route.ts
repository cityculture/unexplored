import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateTicketPdf } from '@/lib/tickets/ticket-generator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await context.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);

    let query = supabaseAdmin
      .from('bookings')
      .select('*, booking_items(*, ticket_tiers(*)), events(*, location:locations(*))');

    if (isUuid) {
      query = query.eq('id', bookingId);
    } else {
      query = query.eq('booking_ref', bookingId);
    }

    const { data: booking, error: bError } = await query.single();

    if (bError || !booking) {
      console.error('Ticket download booking error:', bError);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'confirmed' && booking.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Booking is not confirmed yet' },
        { status: 403 }
      );
    }

    const event = booking.events;
    if (!event) {
      return NextResponse.json({ error: 'Event details not found' }, { status: 404 });
    }

    const pdfBytes = await generateTicketPdf({
      booking_ref: booking.booking_ref,
      attendee_name: booking.attendee_name,
      event_title: event.title || 'City Culture Event',
      event_date: event.start_datetime
        ? new Date(event.start_datetime).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
          })
        : 'Date TBA',
      venue_name: event.location?.venue_name || (event as any).venue_name || (event as any).city || 'Selected Venue',
      items: (booking.booking_items || []).map((item: any) => ({
        ticket_tier_name: item.ticket_tiers?.name || 'General Admission',
        quantity: item.quantity,
      })),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${booking.booking_ref}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('Error in ticket download route:', error);
    return NextResponse.json(
      { error: 'Failed to generate ticket PDF' },
      { status: 500 }
    );
  }
}
