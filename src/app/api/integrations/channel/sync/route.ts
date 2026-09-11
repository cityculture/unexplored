import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPartnerAuth } from '@/lib/integrations/partner-registry'
import { normalizePartnerEvent } from '@/lib/integrations/partner-normalizers'

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const authResult = verifyPartnerAuth(request.headers, rawBody)

    if (!authResult.valid || !authResult.partner) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const partner = authResult.partner
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
    }

    const action = body.action || 'publish' // 'publish' | 'update' | 'cancel'
    const rawEvent = body.event || body

    if (!rawEvent || (!rawEvent.id && !rawEvent.external_id && !rawEvent.title)) {
      return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 })
    }

    const externalId = String(rawEvent.external_id || rawEvent.id)

    // Check if event already exists in City Culture
    const { data: existingEvent } = await (supabaseAdmin as any)
      .from('events')
      .select('id, slug, status')
      .eq('external_source', partner.id)
      .eq('external_event_id', externalId)
      .maybeSingle()

    // Handle cancellation
    if (action === 'cancel') {
      if (existingEvent) {
        await (supabaseAdmin as any)
          .from('events')
          .update({
            status: 'cancelled',
            cancellation_reason: body.cancellation_reason || `Cancelled by ${partner.name}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEvent.id)
      }
      return NextResponse.json({
        success: true,
        action: 'cancelled',
        partner: partner.id,
        event_id: existingEvent?.id || null,
      })
    }

    // Normalize event payload using partner normalizer
    const normalized = normalizePartnerEvent(partner, rawEvent)

    // Resolve Category ID
    const { data: ccCategories } = await supabaseAdmin.from('categories').select('id, slug')
    const categoryMap = new Map(ccCategories?.map((c) => [c.slug, c.id]))
    const defaultCategoryId = categoryMap.get('meetups-networking') || categoryMap.get('workshops-classes')
    const categoryId = categoryMap.get(normalized.category_slug) || defaultCategoryId

    // Resolve Location ID
    let locationId: string | null = null
    if (normalized.location) {
      const loc = normalized.location
      const { data: existingLoc } = await supabaseAdmin
        .from('locations')
        .select('id')
        .eq('venue_name', loc.venue_name)
        .eq('city', loc.city)
        .maybeSingle()

      if (existingLoc) {
        locationId = existingLoc.id
      } else {
        const { data: newLoc, error: locErr } = await supabaseAdmin
          .from('locations')
          .insert({
            venue_name: loc.venue_name,
            address_line1: loc.address_line1,
            address_line2: loc.address_line2,
            city: loc.city,
            state: loc.state,
            country: loc.country,
            country_code: loc.country_code,
            postal_code: loc.postal_code,
            latitude: loc.latitude,
            longitude: loc.longitude,
            google_maps_url: loc.google_maps_url,
          })
          .select('id')
          .single()

        if (newLoc) locationId = newLoc.id
        if (locErr) console.warn('[Channel Sync] Location insert note:', locErr.message)
      }
    }

    // Slug resolution
    let finalSlug = existingEvent ? existingEvent.slug : normalized.slug
    if (!existingEvent) {
      const { data: slugCheck } = await supabaseAdmin.from('events').select('id').eq('slug', finalSlug).maybeSingle()
      if (slugCheck) {
        finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`
      }
    }

    // Build event DB payload
    const eventPayload: any = {
      title: normalized.title,
      slug: finalSlug,
      host_id: normalized.host_id,
      host_page_id: normalized.host_page_id,
      category_id: categoryId,
      location_id: locationId,
      short_description: normalized.short_description,
      description: normalized.description,
      cover_image_url: normalized.cover_image_url,
      vertical_poster_url: normalized.vertical_poster_url,
      event_type: normalized.event_type,
      ticketing_mode: 'platform',
      status: normalized.status,
      start_datetime: normalized.start_datetime,
      end_datetime: normalized.end_datetime,
      timezone: normalized.timezone,
      doors_open_at: normalized.doors_open_at,
      max_capacity: normalized.max_capacity,
      booking_count: normalized.booking_count,
      is_age_restricted: normalized.is_age_restricted,
      min_age: normalized.min_age,
      refund_policy: normalized.refund_policy,
      refund_policy_text: normalized.refund_policy_text,
      is_featured: normalized.is_featured,
      is_sponsored: normalized.is_sponsored,
      external_source: partner.id,
      external_event_id: normalized.external_event_id,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

    // Sync Ticket Tiers
    const tiers = normalized.tiers || []
    for (const tier of tiers) {
      const tierPayload: any = {
        event_id: targetEventId,
        external_tier_id: tier.external_tier_id,
        name: tier.name,
        description: tier.description,
        tier_type: tier.tier_type,
        tier_category: tier.tier_category,
        price: tier.price,
        currency: tier.currency,
        total_quantity: tier.total_quantity,
        sold_count: tier.sold_count,
        max_per_booking: tier.max_per_booking,
        min_per_booking: tier.min_per_booking,
        is_active: tier.is_active,
        sort_order: tier.sort_order,
      }

      if (tier.external_tier_id) {
        const { data: existingTier } = await (supabaseAdmin as any)
          .from('ticket_tiers')
          .select('id')
          .eq('event_id', targetEventId)
          .eq('external_tier_id', tier.external_tier_id)
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

    return NextResponse.json({
      success: true,
      partner: partner.id,
      event_id: targetEventId,
      slug: finalSlug,
      action: existingEvent ? 'updated' : 'created',
      tiers_synced: tiers.length,
    })
  } catch (err: any) {
    console.error('API /api/integrations/channel/sync Error:', err)
    return NextResponse.json({ error: err.message || 'Channel sync failed' }, { status: 500 })
  }
}
