import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyFirebaseToken } from '@/lib/firebase/verify-token'
import { razorpay } from '@/lib/razorpay/client'
import { v5 as uuidv5 } from 'uuid'

const FIREBASE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const body = await request.json()
    const { bookingRef, reason, userId: bodyUserId } = body

    let userId: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1]
      try {
        const decodedToken = await verifyFirebaseToken(token)
        userId = uuidv5(decodedToken.uid, FIREBASE_NAMESPACE)
      } catch (tokenErr) {
        // Fallback: Check if token is service role or valid UUID
        if (token === process.env.SUPABASE_SERVICE_ROLE_KEY && bodyUserId) {
          userId = bodyUserId
        }
      }
    } else if (bodyUserId) {
      // In server action proxy, pass userId if verified by Supabase session
      userId = bodyUserId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Missing valid session' }, { status: 401 })
    }

    if (!bookingRef) {
      return NextResponse.json({ error: 'Missing booking reference' }, { status: 400 })
    }

    // 1. Fetch booking with event details
    const { data: booking, error: bookingError } = await (supabaseAdmin as any)
      .from('bookings')
      .select('*, events(id, host_id, start_datetime, refund_policy, refund_cutoff_hours)')
      .eq('booking_ref', bookingRef)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check ownership or admin
    const isOwner = booking.user_id === userId
    let isAdmin = false
    if (!isOwner) {
      const { data: userProfile } = await (supabaseAdmin as any)
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
      isAdmin = userProfile?.role === 'admin'
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to refund this booking' }, { status: 403 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Only confirmed bookings can be refunded' }, { status: 400 })
    }

    if (booking.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Booking is not marked as paid' }, { status: 400 })
    }

    const event = booking.events
    if (!isAdmin && event?.refund_policy === 'no_refund') {
      return NextResponse.json({ error: 'This booking is non-refundable' }, { status: 400 })
    }

    if (!isAdmin && event?.start_datetime) {
      const eventStart = new Date(event.start_datetime).getTime()
      const cutoffHours = event.refund_cutoff_hours || 0
      const cutoffTime = eventStart - cutoffHours * 60 * 60 * 1000
      if (Date.now() > cutoffTime) {
        return NextResponse.json({ error: 'Refund window has closed for this event' }, { status: 400 })
      }
    }

    if (!booking.razorpay_payment_id) {
      return NextResponse.json({ error: 'No associated payment found to refund' }, { status: 400 })
    }

    // 2. Execute Razorpay Refund
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Razorpay is not configured on the backend server' },
        { status: 500 }
      )
    }

    let razorpayRefundId: string | null = null
    try {
      const refund = await razorpay.payments.refund(booking.razorpay_payment_id, {
        amount: Math.round(Number(booking.total_amount) * 100),
        notes: {
          reason: reason || 'Customer requested refund',
          booking_ref: bookingRef,
        },
      })
      razorpayRefundId = refund.id
    } catch (rzpError: any) {
      console.error('Razorpay refund API call error:', rzpError)
      return NextResponse.json(
        { error: rzpError.description || rzpError.message || 'Payment processor failed to execute refund' },
        { status: 502 }
      )
    }

    // 3. Atomically update database status
    const { error: updateError } = await (supabaseAdmin as any)
      .from('bookings')
      .update({
        status: 'refunded',
        payment_status: 'refunded',
        notes: `Refund processed: ${razorpayRefundId}. Reason: ${reason || 'N/A'}`,
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Database refund update error:', updateError)
    }

    // 4. Invalidate tickets
    await (supabaseAdmin as any)
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('booking_id', booking.id)

    // 5. Log audit trail
    await (supabaseAdmin as any).from('audit_logs').insert({
      actor_id: userId,
      action: 'booking_refunded',
      entity_type: 'booking',
      entity_id: booking.id,
      new_values: { refund_id: razorpayRefundId, reason },
    })

    return NextResponse.json({
      success: true,
      data: {
        refundId: razorpayRefundId,
        bookingRef,
      },
    })
  } catch (err: any) {
    console.error('POST /api/bookings/refund error:', err)
    return NextResponse.json({ error: err.message || 'Refund processing failed' }, { status: 500 })
  }
}
