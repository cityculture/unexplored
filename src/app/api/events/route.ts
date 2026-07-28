import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { firebaseAdminAuth } from '@/lib/firebase/admin'
import { v5 as uuidv5 } from 'uuid'

const FIREBASE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const categorySlug = searchParams.get('categorySlug') || searchParams.get('category')
    const dateFrom = searchParams.get('dateFrom') || searchParams.get('date_from')
    const dateTo = searchParams.get('dateTo') || searchParams.get('date_to')
    const maxPrice = searchParams.get('maxPrice') || searchParams.get('max_price')
    const keyword = searchParams.get('keyword') || searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '12', 10)

    let query = supabaseAdmin
      .from('v_events_public')
      .select('*', { count: 'exact' })

    if (city) query = query.ilike('city', `%${city}%`)
    if (categorySlug) query = query.eq('category_slug', categorySlug)
    if (dateFrom) query = query.gte('start_datetime', dateFrom)
    if (dateTo) query = query.lte('start_datetime', dateTo)
    if (maxPrice) query = query.lte('min_price', parseFloat(maxPrice))
    if (keyword) query = query.ilike('title', `%${keyword}%`)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query
      .order('is_featured', { ascending: false })
      .order('start_datetime', { ascending: true })
      .range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('API GET /api/events Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: data || [],
      events: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken)
    const supabaseUid = uuidv5(decodedToken.uid, FIREBASE_NAMESPACE)

    const body = await request.json()

    // 1. Create Location if provided
    let locationId: string | null = null
    if (body.location) {
      const { data: loc, error: locError } = await supabaseAdmin
        .from('locations')
        .insert({
          venue_name: body.location.venue_name || null,
          address_line1: body.location.address_line_1 || null,
          city: body.location.city || '',
          state: body.location.state || null,
          country: body.location.country || '',
          postal_code: body.location.postal_code || null,
        })
        .select('id')
        .single()

      if (locError) throw locError
      locationId = loc.id
    }

    // 2. Insert Event
    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7)
    const { data: createdEvent, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        title: body.title,
        host_id: supabaseUid,
        host_page_id: body.host_page_id,
        category_id: body.category_id,
        location_id: locationId,
        event_type: body.event_type,
        status: body.status || 'draft',
        start_datetime: body.start_datetime,
        end_datetime: body.end_datetime,
        timezone: body.timezone || 'Asia/Kolkata',
        short_description: body.short_description,
        description: body.description,
        cover_image_url: body.cover_image_url || null,
        vertical_poster_url: body.vertical_poster_url || null,
        is_age_restricted: body.is_age_restricted || false,
        min_age: body.min_age || 0,
        doors_open_at: body.doors_open_at || null,
        refund_policy: body.refund_policy || 'no_refunds',
        refund_policy_text: body.refund_policy_text || null,
        ticketing_mode: body.ticketing_mode || 'single',
        slug,
      } as any)
      .select('*')
      .single()

    if (eventError) throw eventError

    // 3. Insert Ticket Tiers
    if (body.ticket_tiers && body.ticket_tiers.length > 0) {
      const { error: tierError } = await supabaseAdmin
        .from('ticket_tiers')
        .insert(
          body.ticket_tiers.map((t: any) => ({
            event_id: createdEvent.id,
            name: t.name,
            tier_type: t.tier_type,
            tier_category: t.tier_category,
            price: t.price,
            total_quantity: t.total_quantity,
            max_per_booking: t.max_per_booking,
          }))
        )

      if (tierError) throw tierError
    }

    return NextResponse.json({ success: true, event: createdEvent })
  } catch (err: any) {
    console.error('API POST /api/events Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create event' }, { status: 500 })
  }
}
