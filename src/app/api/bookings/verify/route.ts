import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { syncTicketSaleToStrangerMingle } from '@/lib/integrations/strangermingle-sync'
import { env } from '@/lib/env_server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingRef } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingRef) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters' },
        { status: 400 }
      )
    }

    // Strict validation: RAZORPAY_KEY_SECRET must be configured
    const secret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET
    if (!secret || secret.trim() === '') {
      console.error('CRITICAL: RAZORPAY_KEY_SECRET is not configured in backend environment')
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      )
    }

    // 1. Verify HMAC-SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8')
    )

    if (!isMatch) {
      console.warn(`Payment signature mismatch for booking ${bookingRef}`)
      return NextResponse.json(
        { error: 'Payment verification failed: Invalid signature' },
        { status: 400 }
      )
    }

    // 2. Fetch booking using supabaseAdmin
    const { data: booking, error: fetchError } = await (supabaseAdmin as any)
      .from('bookings')
      .select('id, user_id, razorpay_order_id, booking_ref, status')
      .eq('booking_ref', bookingRef)
      .single()

    if (fetchError || !booking) {
      console.error('Verify Payment: Booking not found:', bookingRef, fetchError)
      return NextResponse.json({ error: 'Booking record not found' }, { status: 404 })
    }

    // Check if already confirmed (idempotency)
    if (booking.status === 'confirmed') {
      return NextResponse.json({
        success: true,
        data: {
          bookingId: booking.id,
          bookingRef: booking.booking_ref,
          status: 'confirmed',
        },
      })
    }

    // 3. Verify order ID matches
    if (booking.razorpay_order_id !== razorpay_order_id) {
      console.warn(`Order ID mismatch: expected ${booking.razorpay_order_id}, got ${razorpay_order_id}`)
      return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 })
    }

    // 4. Atomically confirm booking via RPC v2
    type ConfirmedTicket = {
      r_ticket_id: string
      r_event_id: string
    }

    const { data: tickets, error: rpcError } = await (supabaseAdmin as any)
      .rpc('confirm_booking_payment_v2', {
        p_booking_id: booking.id,
        p_razorpay_payment_id: razorpay_payment_id,
        p_razorpay_signature: razorpay_signature,
        p_razorpay_method: 'online',
      })

    if (rpcError || !tickets) {
      console.error('RPC confirm_booking_payment_v2 error:', rpcError)
      return NextResponse.json({ error: 'Failed to finalize booking in database' }, { status: 500 })
    }

    const confirmedTickets = (tickets || []) as ConfirmedTicket[]

    // 5. Update tickets with cryptographically signed QR data
    for (const ticket of confirmedTickets) {
      const ticketData = {
        ticketId: ticket.r_ticket_id,
        eventId: ticket.r_event_id,
        bookingRef: booking.booking_ref,
      }
      const qrContent = JSON.stringify(ticketData)
      const signedQr = crypto.createHmac('sha256', secret).update(qrContent).digest('hex')

      await (supabaseAdmin as any)
        .from('tickets')
        .update({
          qr_code_data: `${qrContent}|${signedQr}`,
        })
        .eq('id', ticket.r_ticket_id)
    }

    // 6. Audit Log
    try {
      await (supabaseAdmin as any).from('audit_logs').insert({
        actor_id: booking.user_id,
        action: 'payment_verified',
        entity_type: 'booking',
        entity_id: booking.id,
        new_values: { payment_id: razorpay_payment_id, status: 'confirmed' },
      })
    } catch (auditErr) {
      console.error('Failed to log audit event:', auditErr)
    }

    // 7. Trigger confirmation email
    try {
      const { data: bookingDetails } = await (supabaseAdmin as any)
        .from('bookings')
        .select(`
          total_amount,
          booking_ref,
          attendee_name,
          attendee_email,
          user_id,
          events (title),
          booking_items (
            quantity,
            unit_price,
            ticket_tiers (name)
          )
        `)
        .eq('id', booking.id)
        .single()

      if (bookingDetails) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
        if (baseUrl && serviceKey) {
          const functionUrl = `${baseUrl}/functions/v1/send-email`
          const emailPayload = {
            user_id: bookingDetails.user_id,
            subject: `Your ticket for ${bookingDetails.events?.title || 'Event'}`,
            body: `Thank you for your purchase! Your booking for <strong>${bookingDetails.events?.title}</strong> is confirmed.`,
            action_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cityculture.in'}/members/bookings/${bookingDetails.booking_ref}`,
            meta_data: {
              total: bookingDetails.total_amount,
              ref: bookingDetails.booking_ref,
              items: (bookingDetails.booking_items || []).map((item: any) => ({
                name: item.ticket_tiers?.name || 'Ticket',
                quantity: item.quantity,
                price: (Number(item.unit_price) * item.quantity).toFixed(2),
              })),
            },
          }

          fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify(emailPayload),
          }).catch((err) => console.error('Background send-email error:', err))
        }
      }
    } catch (emailErr) {
      console.error('Failed to prepare confirmation email:', emailErr)
    }

    // 8. Sync ticket sale to Stranger Mingle if it is an external source event
    try {
      await syncTicketSaleToStrangerMingle(booking.id)
    } catch (smSyncErr) {
      console.error('Failed to sync ticket sale to Stranger Mingle:', smSyncErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        bookingRef: booking.booking_ref,
        status: 'confirmed',
      },
    })
  } catch (err: any) {
    console.error('POST /api/bookings/verify error:', err)
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 })
  }
}
