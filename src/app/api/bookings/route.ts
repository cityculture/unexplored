import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { firebaseAdminAuth } from '@/lib/firebase/admin'
import { createRazorpayOrder } from '@/lib/razorpay/createOrder'
import { v5 as uuidv5 } from 'uuid'
import crypto from 'crypto'

const FIREBASE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, items, attendee_name, attendee_email, attendee_phone, idToken } = body

    if (!event_id || !items || !attendee_email) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 })
    }

    // Identify User ID
    let finalUserId: string | null = null
    if (idToken) {
      try {
        const decoded = await firebaseAdminAuth.verifyIdToken(idToken)
        finalUserId = uuidv5(decoded.uid, FIREBASE_NAMESPACE)
      } catch (e) {
        console.warn('Invalid token provided, falling back to guest email search')
      }
    }

    if (!finalUserId) {
      // Guest Flow: Fetch or Create User via supabaseAdmin
      const { data: existingUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', attendee_email)
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        finalUserId = existingUsers[0].id
      } else {
        const username = (attendee_name || 'guest').toLowerCase().replace(/\s+/g, '') + Math.random().toString(36).substring(2, 6)
        const alias = `Guest#${Math.floor(1000 + Math.random() * 9000)}`
        
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            email: attendee_email,
            username,
            anonymous_alias: alias,
            role: 'member'
          })
          .select('id')
          .single()

        if (createError || !newUser) {
          return NextResponse.json({ error: 'Failed to create guest user record' }, { status: 500 })
        }
        finalUserId = newUser.id
      }
    }

    // Fetch Event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, ticketing_mode, status')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Fetch Tiers & Calculate Total
    let totalAmount = 0
    const tierIds = items.map((i: any) => i.tier_id)
    const { data: tiers } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*')
      .in('id', tierIds)

    if (!tiers || tiers.length === 0) {
      return NextResponse.json({ error: 'Selected ticket tiers not found' }, { status: 400 })
    }

    for (const item of items) {
      const tier = tiers.find(t => t.id === item.tier_id)
      if (tier) {
        totalAmount += Number(tier.price) * item.quantity
      }
    }

    // Generate Booking Ref & Create Booking
    const bookingRef = 'CC-' + crypto.randomBytes(4).toString('hex').toUpperCase()
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        booking_ref: bookingRef,
        user_id: finalUserId,
        event_id: event_id,
        status: totalAmount === 0 ? 'confirmed' : 'pending',
        payment_status: totalAmount === 0 ? 'free' : 'unpaid',
        total_amount: totalAmount,
        subtotal: totalAmount,
        taxable_amount: 0,
        platform_fee: 0,
        host_payout: totalAmount,
        currency: 'INR',
        attendee_name,
        attendee_email,
        attendee_phone: attendee_phone || null,
        created_at: new Date().toISOString()
      } as any)
      .select('*')
      .single()

    if (bookingError || !booking) {
      console.error('Booking Creation Error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // If Free/RSVP
    if (totalAmount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          bookingId: booking.id,
          bookingRef: booking.booking_ref,
          razorpayOrderId: '',
          totalAmount: 0,
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        }
      })
    }

    // Create Razorpay Order (amount in paise)
    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: booking.booking_ref,
    })

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        bookingRef: booking.booking_ref,
        razorpayOrderId: razorpayOrder.id,
        totalAmount,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      }
    })
  } catch (err: any) {
    console.error('API /api/bookings Error:', err)
    return NextResponse.json({ error: err.message || 'Booking initiation failed' }, { status: 500 })
  }
}
