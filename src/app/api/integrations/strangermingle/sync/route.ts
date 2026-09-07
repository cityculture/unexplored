import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const CC_HOST_USER_ID = 'bc4a046a-2dfa-480a-9983-7f473c81bf57' // strangermingleteam@gmail.com
const CC_HOST_PAGE_ID = '40f05b7d-b254-4212-b89d-00ff0af1f14f' // Stranger Mingle Host Page

const CATEGORY_MAP: Record<string, string> = {
  'meetups': 'meetups-networking',
  'music-concerts': 'music-concerts',
  'parties-nightlife': 'parties-nightlife',
  'workshops-classes': 'workshops-classes',
  'food-drinks': 'food-drinks',
  'art-culture': 'art-culture',
  'sports-fitness': 'sports-fitness',
  'tech-innovation': 'tech-innovation',
  'family-kids': 'family-kids',
  'comedy-theatre': 'theatre-comedy',
  'theatre-comedy': 'theatre-comedy',
  'travel-adventure': 'travel-adventure',
  'health-wellness': 'health-wellness',
  'online-events': 'meetups-networking',
  'other': 'meetups-networking',
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get('Authorization')
    const apiKeyHeader = request.headers.get('x-api-key')
    const expectedSecret = process.env.STRANGERMINGLE_SYNC_SECRET || 'sm_cc_sync_sec_8a39f1c7d2e45b6890f1'

    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : apiKeyHeader
    if (!token || token !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid sync secret' }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action || 'publish' // 'publish' | 'update' | 'cancel'
    const smEvent = body.event || body

    if (!smEvent || (!smEvent.id && !smEvent.external_id && !smEvent.title)) {
      return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 })
    }

    const externalEventId = smEvent.external_id || smEvent.id

    // Check if event already exists in City Culture
    const { data: existingEvent } = await (supabaseAdmin as any)
      .from('events')
      .select('id, slug')
      .eq('external_source', 'strangermingle')
      .eq('external_event_id', externalEventId)
      .maybeSingle()

    // If action is cancel
    if (action === 'cancel') {
      if (existingEvent) {
        await (supabaseAdmin as any)
          .from('events')
          .update({
            status: 'cancelled',
            cancellation_reason: body.cancellation_reason || 'Cancelled by Stranger Mingle',
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', existingEvent.id)
      }
      return NextResponse.json({ success: true, action: 'cancelled', event_id: existingEvent?.id })
    }

    // 2. Resolve Category
    const { data: ccCategories } = await supabaseAdmin.from('categories').select('id, slug')
    const categoryMap = new Map(ccCategories?.map(c => [c.slug, c.id]))
    const defaultCategoryId = categoryMap.get('meetups-networking')

    const rawCategory = (typeof smEvent.category === 'string' ? smEvent.category : smEvent.categories?.slug) || 'meetups'
    const targetSlug = CATEGORY_MAP[rawCategory.toLowerCase()] || 'meetups-networking'
    const categoryId = categoryMap.get(targetSlug) || defaultCategoryId

    // 3. Resolve Location
    let locationId: string | null = null
    const loc = smEvent.location || smEvent.locations || smEvent.venue
    if (loc) {
      const venueName = loc.venue_name || loc.name || 'City Venue'
      const city = loc.city || 'Pune'

      const { data: existingLoc } = await supabaseAdmin
        .from('locations')
        .select('id')
        .eq('venue_name', venueName)
        .eq('city', city)
        .maybeSingle()

      if (existingLoc) {
        locationId = existingLoc.id
      } else {
        const { data: newLoc } = await supabaseAdmin
          .from('locations')
          .insert({
            venue_name: venueName,
            address_line1: loc.address_line1 || loc.address || null,
            address_line2: loc.address_line2 || null,
            city: city,
            state: loc.state || 'Maharashtra',
            country: loc.country || 'India',
            country_code: loc.country_code || 'IN',
            postal_code: loc.postal_code || null,
            latitude: loc.latitude || null,
            longitude: loc.longitude || null,
            google_maps_url: loc.google_maps_url || null,
          })
          .select('id')
          .single()

        if (newLoc) locationId = newLoc.id
      }
    }

    // 4. Resolve unique slug
    let slug = smEvent.slug || smEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (!existingEvent) {
      const { data: slugCheck } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (slugCheck) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
      }
    } else {
      slug = existingEvent.slug
    }

    // Format doors_open_at (HH:mm:ss)
    let doorsOpenTime = null
    if (smEvent.doors_open_at) {
      if (typeof smEvent.doors_open_at === 'string' && smEvent.doors_open_at.includes('T')) {
        const match = smEvent.doors_open_at.match(/T(\d{2}:\d{2}:\d{2})/)
        doorsOpenTime = match ? match[1] : null
      } else {
        doorsOpenTime = smEvent.doors_open_at
      }
    }

    // 5. Build Event Payload
    const eventPayload: any = {
      title: smEvent.title,
      slug: slug,
      host_id: CC_HOST_USER_ID,
      host_page_id: CC_HOST_PAGE_ID,
      category_id: categoryId,
      location_id: locationId,
      short_description: smEvent.short_description || smEvent.title,
      description: smEvent.description || smEvent.short_description || smEvent.title,
      cover_image_url: smEvent.cover_image_url || null,
      vertical_poster_url: smEvent.vertical_poster_url || smEvent.cover_image_url || null,
      event_type: smEvent.event_type || (locationId ? 'in_person' : 'online'),
      ticketing_mode: 'platform',
      status: smEvent.status || 'published',
      start_datetime: smEvent.start_datetime,
      end_datetime: smEvent.end_datetime,
      timezone: smEvent.timezone || 'Asia/Kolkata',
      doors_open_at: doorsOpenTime,
      max_capacity: smEvent.max_capacity || 30,
      is_age_restricted: smEvent.is_age_restricted || false,
      min_age: smEvent.min_age || 0,
      refund_policy: smEvent.refund_policy || 'no_refund',
      refund_policy_text: smEvent.refund_policy_text || null,
      is_featured: smEvent.is_featured || false,
      is_sponsored: smEvent.is_sponsored || false,
      external_source: 'strangermingle',
      external_event_id: externalEventId,
      published_at: smEvent.published_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    let targetEventId: string

    if (existingEvent) {
      const { data: updated, error: updateErr } = await (supabaseAdmin as any)
        .from('events')
        .update(eventPayload)
        .eq('id', existingEvent.id)
        .select('id')
        .single()

      if (updateErr) throw updateErr
      targetEventId = updated.id
    } else {
      const { data: inserted, error: insertErr } = await (supabaseAdmin as any)
        .from('events')
        .insert(eventPayload)
        .select('id')
        .single()

      if (insertErr) throw insertErr
      targetEventId = inserted.id
    }

    // 6. Sync Ticket Tiers
    const tiers = smEvent.ticket_tiers || smEvent.tiers || []
    if (tiers.length > 0) {
      for (const tier of tiers) {
        const tierPayload: any = {
          event_id: targetEventId,
          external_tier_id: tier.id || null,
          name: tier.name,
          description: tier.description || null,
          tier_type: tier.tier_type || (tier.price > 0 ? 'paid' : 'free'),
          tier_category: tier.name.toLowerCase().includes('girl') ? 'Girls' :
                         tier.name.toLowerCase().includes('boy') ? 'Boys' :
                         tier.name.toLowerCase().includes('couple') ? 'Couple' : 'General',
          price: tier.price || 0,
          currency: tier.currency || 'INR',
          total_quantity: tier.total_quantity || 20,
          sold_count: tier.sold_count || 0,
          max_per_booking: tier.max_per_booking || 5,
          min_per_booking: tier.min_per_booking || 1,
          is_active: tier.is_active !== false,
          sort_order: tier.sort_order || 0,
        }

        if (tier.id) {
          const { data: existingTier } = await (supabaseAdmin as any)
            .from('ticket_tiers')
            .select('id')
            .eq('event_id', targetEventId)
            .eq('external_tier_id', tier.id)
            .maybeSingle()

          if (existingTier) {
            await (supabaseAdmin as any).from('ticket_tiers').update(tierPayload).eq('id', existingTier.id)
          } else {
            await (supabaseAdmin as any).from('ticket_tiers').insert(tierPayload)
          }
        } else {
          await (supabaseAdmin as any).from('ticket_tiers').insert(tierPayload)
        }
      }
    }

    return NextResponse.json({
      success: true,
      event_id: targetEventId,
      action: existingEvent ? 'updated' : 'created',
      tiers_synced: tiers.length
    })
  } catch (err: any) {
    console.error('API /api/integrations/strangermingle/sync Error:', err)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
