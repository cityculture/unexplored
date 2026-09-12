import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyFirebaseToken } from '@/lib/firebase/verify-token'
import { createRazorpayOrder } from '@/lib/razorpay/createOrder'
import { syncTicketSaleToExternalSource } from '@/lib/integrations/partner-inventory-sync'
import { v5 as uuidv5 } from 'uuid'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FIREBASE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event_id = body.event_id || body.eventId
    const attendee_name = body.attendee_name || body.name || 'Guest'
    const attendee_email = body.attendee_email || body.email
    const attendee_phone = body.attendee_phone || body.phone
    const idToken = body.idToken
    const items = body.items || (Array.isArray(body.tickets) ? body.tickets.map((t: any) => ({
      ticket_tier_id: t.tierId || t.ticket_tier_id,
      quantity: t.quantity,
    })) : null)

    if (!event_id || !items || !attendee_email) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 })
    }

    // Identify User ID
    let finalUserId: string | null = null
    if (idToken) {
      try {
        const decoded = await verifyFirebaseToken(idToken)
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
            username: alias,
            role: 'member',
            full_name: attendee_name || 'Guest'
          })
          .select('id')
          .single()

        if (createError || !newUser) {
          console.error('Failed to create guest user record:', createError)
          return NextResponse.json({ error: `Failed to create guest user record: ${createError?.message || ''}` }, { status: 500 })
        }
        finalUserId = newUser.id
      }
    }

    // Fetch Event
    const { data: event, error: eventError } = await (supabaseAdmin as any)
      .from('events')
      .select('id, ticketing_mode, status, external_source, external_event_id')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Fetch Tiers & Calculate Total
    let totalAmount = 0
    const tierIds = items.map((i: any) => i.tier_id || i.ticket_tier_id)
    const { data: tiers } = await supabaseAdmin
      .from('ticket_tiers')
      .select('*')
      .in('id', tierIds)

    if (!tiers || tiers.length === 0) {
      return NextResponse.json({ error: 'Selected ticket tiers not found' }, { status: 400 })
    }

    const bookingItemsToInsert: any[] = []
    for (const item of items) {
      const tierId = item.tier_id || item.ticket_tier_id
      const tier = tiers.find(t => t.id === tierId)
      if (tier) {
        const itemPrice = Number(tier.price)
        totalAmount += itemPrice * item.quantity
        bookingItemsToInsert.push({
          ticket_tier_id: tier.id,
          quantity: item.quantity,
          unit_price: itemPrice,
          subtotal: itemPrice * item.quantity
        })
      }
    }

    // Generate default Booking Ref
    const fallbackBookingRef = 'CC-' + crypto.randomBytes(4).toString('hex').toUpperCase()
    const isFree = totalAmount === 0

    const itemsForRpc = bookingItemsToInsert.map(bi => ({
      tierId: bi.ticket_tier_id,
      quantity: bi.quantity,
      unitPrice: bi.unit_price,
      subtotal: bi.subtotal,
    }))

    let bookingId: string | null = null
    let finalBookingRef: string = fallbackBookingRef
    let razorpayOrderId: string = ''

    // If paid, create Razorpay order first so order ID can be stored with booking
    if (!isFree) {
      try {
        const razorpayOrder = await createRazorpayOrder({
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          receipt: fallbackBookingRef,
        })
        razorpayOrderId = razorpayOrder.id
      } catch (rzpErr: any) {
        console.error('Razorpay Order Creation Error:', rzpErr)
        return NextResponse.json({ error: `Payment gateway error: ${rzpErr.message || 'Failed to create order'}` }, { status: 500 })
      }
    }

    // Attempt atomic booking creation via create_pending_booking_v2 RPC
    const { data: rpcBookingId, error: rpcError } = await (supabaseAdmin as any).rpc('create_pending_booking_v2', {
      p_event_id: event_id,
      p_user_id: finalUserId,
      p_attendee_name: attendee_name || 'Guest',
      p_attendee_email: attendee_email,
      p_attendee_phone: attendee_phone || null,
      p_total_amount: totalAmount,
      p_subtotal: totalAmount,
      p_discount_amount: 0,
      p_razorpay_order_id: razorpayOrderId || null,
      p_items: itemsForRpc,
    })

    if (!rpcError && rpcBookingId) {
      bookingId = rpcBookingId
      const { data: bRow } = await (supabaseAdmin as any)
        .from('bookings')
        .select('booking_ref')
        .eq('id', bookingId)
        .single()
      if (bRow?.booking_ref) {
        finalBookingRef = bRow.booking_ref
      }
    } else {
      // Fallback to direct insertion if RPC fails or is missing
      console.warn('Fallback to direct booking insertion:', rpcError?.message)
      const { data: booking, error: bookingError } = await (supabaseAdmin as any)
        .from('bookings')
        .insert({
          booking_ref: fallbackBookingRef,
          user_id: finalUserId,
          event_id: event_id,
          status: isFree ? 'confirmed' : 'pending',
          payment_status: isFree ? 'paid' : 'unpaid',
          total_amount: totalAmount,
          subtotal: totalAmount,
          taxable_amount: 0,
          platform_fee: 0,
          host_payout: totalAmount,
          currency: 'INR',
          razorpay_order_id: razorpayOrderId || null,
          attendee_name: attendee_name || 'Guest',
          attendee_email: attendee_email,
          attendee_phone: attendee_phone || null,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
        .select('*')
        .single()

      if (bookingError || !booking) {
        console.error('Booking Creation Error:', bookingError)
        return NextResponse.json({ error: `Failed to create booking: ${bookingError?.message || 'Database error'}` }, { status: 500 })
      }

      bookingId = booking.id
      finalBookingRef = booking.booking_ref

      if (bookingItemsToInsert.length > 0) {
        await (supabaseAdmin as any)
          .from('booking_items')
          .insert(bookingItemsToInsert.map(bi => ({ ...bi, booking_id: bookingId })))
      }
    }

    // If Free Booking, sync if external source
    if (isFree && bookingId) {
      try {
        await syncTicketSaleToExternalSource(bookingId)
      } catch (syncErr) {
        console.error('[External Sync Error on Free Booking]:', syncErr)
      }
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ''

    return NextResponse.json({
      success: true,
      bookingId,
      bookingRef: finalBookingRef,
      razorpayOrderId,
      keyId,
      amount: totalAmount * 100,
      currency: 'INR',
      isFree: isFree,
      data: {
        bookingId,
        bookingRef: finalBookingRef,
        razorpayOrderId,
        totalAmount,
        keyId,
      }
    })
  } catch (err: any) {
    console.error('API /api/bookings Error:', err)
    return NextResponse.json({ error: err.message || 'Booking initiation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ref = searchParams.get('ref') || searchParams.get('bookingId') || searchParams.get('id')
    const authHeader = request.headers.get('Authorization')

    if (ref) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)
      let query = supabaseAdmin
        .from('bookings')
        .select(`
          *,
          events(
            *,
            location:locations(*)
          ),
          booking_items(
            *,
            ticket_tiers(*)
          ),
          tickets(
            *,
            booking_items(
              *,
              ticket_tiers(*)
            )
          )
        `)

      if (isUuid) {
        query = query.eq('id', ref)
      } else {
        query = query.eq('booking_ref', ref)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        console.error('GET booking error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (data) {
        delete (data as any).razorpay_signature
      }

      return NextResponse.json({ booking: data })
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1]
      let supabaseUid: string | null = null
      try {
        const decoded = await verifyFirebaseToken(token)
        supabaseUid = uuidv5(decoded.uid, FIREBASE_NAMESPACE)
      } catch {
        try {
          const { data: sbUser } = await supabaseAdmin.auth.getUser(token)
          if (sbUser?.user) {
            supabaseUid = sbUser.user.id
          }
        } catch {
          // ignore
        }
      }

      if (!supabaseUid) {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
      }

      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          events(*),
          booking_items(
            *,
            ticket_tiers(*)
          )
        `)
        .eq('user_id', supabaseUid)
        .order('created_at', { ascending: false })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ bookings: data || [] })
    }

    return NextResponse.json({ error: 'Missing ref parameter or Authorization header' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
