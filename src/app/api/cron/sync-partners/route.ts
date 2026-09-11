import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PARTNERS } from '@/lib/integrations/partner-registry'
import { normalizePartnerEvent } from '@/lib/integrations/partner-normalizers'

const SM_SUPABASE_URL = process.env.STRANGERMINGLE_SUPABASE_URL || 'https://uuanzogrkoomekskvxab.supabase.co'
const SM_SERVICE_ROLE_KEY = process.env.STRANGERMINGLE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YW56b2dya29vbWVrc2t2eGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAxNzcxMywiZXhwIjoyMDg4NTkzNzEzfQ.7nikLlaSNSRB0KZsfMgFMa-rLgy0YzZv-27-ElJshng'

const SALTY_SUPABASE_URL = process.env.SALTY_SUPABASE_URL || 'https://dwizjplnmxlyhkbxbosw.supabase.co'
const SALTY_SERVICE_ROLE_KEY = process.env.SALTY_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpqcGxubXhseWhrYnhib3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUxNDE1OSwiZXhwIjoyMDc1MDkwMTU5fQ.ch95cmmFDF4lU5Uwp0TcDd-5UhI92MdZSXsxnnqyu3U'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function upsertNormalizedEvent(normalized: ReturnType<typeof normalizePartnerEvent>, partnerId: string) {
  // Check if event already exists
  const { data: existingEvent } = await (supabaseAdmin as any)
    .from('events')
    .select('id, slug, status')
    .eq('external_source', partnerId)
    .eq('external_event_id', normalized.external_event_id)
    .maybeSingle()

  // Resolve Category
  const { data: ccCategories } = await supabaseAdmin.from('categories').select('id, slug')
  const categoryMap = new Map(ccCategories?.map((c) => [c.slug, c.id]))
  const defaultCategoryId = categoryMap.get('meetups-networking') || categoryMap.get('workshops-classes')
  const categoryId = categoryMap.get(normalized.category_slug) || defaultCategoryId

  // Resolve Location
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
      const { data: newLoc } = await supabaseAdmin
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
    }
  }

  // Resolve Slug
  let finalSlug = existingEvent ? existingEvent.slug : normalized.slug
  if (!existingEvent) {
    const { data: slugCheck } = await supabaseAdmin.from('events').select('id').eq('slug', finalSlug).maybeSingle()
    if (slugCheck) {
      finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`
    }
  }

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
    external_source: partnerId,
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

  // Sync Tiers
  for (const tier of normalized.tiers) {
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

  return targetEventId
}

export async function GET(request: NextRequest) {
  try {
    const smPartner = PARTNERS.strangermingle
    const saltyPartner = PARTNERS.saltymedia

    const results = {
      strangermingle: { total: 0, synced: 0, errors: [] as string[] },
      saltymedia: { total: 0, synced: 0, errors: [] as string[] },
    }

    // 1. Sync Stranger Mingle
    try {
      const smClient = createClient(SM_SUPABASE_URL, SM_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data: smEvents, error: smErr } = await smClient
        .from('events')
        .select('*, locations(*), ticket_tiers(*), categories(*)')
        .eq('status', 'published')

      if (smErr) throw smErr

      results.strangermingle.total = smEvents?.length || 0
      for (const smEvent of smEvents || []) {
        try {
          const normalized = normalizePartnerEvent(smPartner, smEvent)
          await upsertNormalizedEvent(normalized, 'strangermingle')
          results.strangermingle.synced++
        } catch (err: any) {
          results.strangermingle.errors.push(`Event ${smEvent.id}: ${err.message}`)
        }
      }
    } catch (err: any) {
      results.strangermingle.errors.push(`Global SM Sync Error: ${err.message}`)
    }

    // 2. Sync Salty Media
    try {
      const saltyClient = createClient(SALTY_SUPABASE_URL, SALTY_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data: saltyEvents, error: saltyErr } = await saltyClient
        .from('events')
        .select('*, ticket_tiers(*)')
        .in('status', ['upcoming', 'published'])

      if (saltyErr) throw saltyErr

      results.saltymedia.total = saltyEvents?.length || 0
      for (const saltyEvent of saltyEvents || []) {
        try {
          const normalized = normalizePartnerEvent(saltyPartner, saltyEvent)
          await upsertNormalizedEvent(normalized, 'saltymedia')
          results.saltymedia.synced++
        } catch (err: any) {
          results.saltymedia.errors.push(`Salty Event ${saltyEvent.id}: ${err.message}`)
        }
      }
    } catch (err: any) {
      results.saltymedia.errors.push(`Global Salty Sync Error: ${err.message}`)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (err: any) {
    console.error('API /api/cron/sync-partners Error:', err)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
