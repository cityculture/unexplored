import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'

const SM_SUPABASE_URL = process.env.STRANGERMINGLE_SUPABASE_URL || 'https://uuanzogrkoomekskvxab.supabase.co'
const SM_SERVICE_ROLE_KEY = process.env.STRANGERMINGLE_SUPABASE_SERVICE_ROLE_KEY

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

export async function GET(request: NextRequest) {
  try {
    if (!SM_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing STRANGERMINGLE_SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const smClient = createClient(SM_SUPABASE_URL, SM_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // Fetch published events from Stranger Mingle
    const { data: smEvents, error: smErr } = await smClient
      .from('events')
      .select('*, locations(*), ticket_tiers(*), categories(*)')
      .eq('status', 'published')

    if (smErr) throw smErr

    const { data: ccCategories } = await supabaseAdmin.from('categories').select('id, slug')
    const categoryMap = new Map(ccCategories?.map(c => [c.slug, c.id]))
    const defaultCategoryId = categoryMap.get('meetups-networking')

    let syncedCount = 0

    for (const smEvent of smEvents || []) {
      const { data: existingEvent } = await (supabaseAdmin as any)
        .from('events')
        .select('id, slug')
        .eq('external_source', 'strangermingle')
        .eq('external_event_id', smEvent.id)
        .maybeSingle()

      // Resolve Location
      let locationId = null
      const loc = smEvent.locations
      if (loc) {
        const venueName = loc.venue_name || 'City Venue'
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

      // Resolve Category
      const smCatSlug = smEvent.categories?.slug || 'meetups'
      const targetSlug = CATEGORY_MAP[smCatSlug] || 'meetups-networking'
      const categoryId = categoryMap.get(targetSlug) || defaultCategoryId

      // Resolve Slug
      let slug = smEvent.slug
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

      let doorsOpenTime = null
      if (smEvent.doors_open_at) {
        if (typeof smEvent.doors_open_at === 'string' && smEvent.doors_open_at.includes('T')) {
          const match = smEvent.doors_open_at.match(/T(\d{2}:\d{2}:\d{2})/)
          doorsOpenTime = match ? match[1] : null
        } else {
          doorsOpenTime = smEvent.doors_open_at
        }
      }

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
        status: 'published',
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
        external_event_id: smEvent.id,
        published_at: smEvent.published_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      let targetEventId = existingEvent?.id

      if (existingEvent) {
        await (supabaseAdmin as any).from('events').update(eventPayload).eq('id', existingEvent.id)
      } else {
        const { data: inserted } = await (supabaseAdmin as any).from('events').insert(eventPayload).select('id').single()
        if (inserted) targetEventId = inserted.id
      }

      // Sync ticket tiers
      for (const smTier of smEvent.ticket_tiers || []) {
        const tierPayload: any = {
          event_id: targetEventId,
          external_tier_id: smTier.id,
          name: smTier.name,
          description: smTier.description || null,
          tier_type: smTier.tier_type || (smTier.price > 0 ? 'paid' : 'free'),
          tier_category: smTier.name.toLowerCase().includes('girl') ? 'Girls' :
                         smTier.name.toLowerCase().includes('boy') ? 'Boys' :
                         smTier.name.toLowerCase().includes('couple') ? 'Couple' : 'General',
          price: smTier.price || 0,
          currency: smTier.currency || 'INR',
          total_quantity: smTier.total_quantity || 20,
          sold_count: smTier.sold_count || 0,
          max_per_booking: smTier.max_per_booking || 5,
          min_per_booking: smTier.min_per_booking || 1,
          is_active: smTier.is_active !== false,
          sort_order: smTier.sort_order || 0,
        }

        const { data: existingTier } = await (supabaseAdmin as any)
          .from('ticket_tiers')
          .select('id')
          .eq('event_id', targetEventId)
          .eq('external_tier_id', smTier.id)
          .maybeSingle()

        if (existingTier) {
          await (supabaseAdmin as any).from('ticket_tiers').update(tierPayload).eq('id', existingTier.id)
        } else {
          await (supabaseAdmin as any).from('ticket_tiers').insert(tierPayload)
        }
      }

      syncedCount++
    }

    return NextResponse.json({ success: true, synced_count: syncedCount })
  } catch (err: any) {
    console.error('Error in /api/cron/sync-strangermingle:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
