import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const slugOrId = resolvedParams.slug

    // Try fetching by slug first
    let { data, error } = await supabaseAdmin
      .from('events')
      .select(
        `
        id,
        slug,
        title,
        description,
        short_description,
        cover_image_url,
        event_type,
        online_platform,
        online_url_reveal,
        status,
        start_datetime,
        end_datetime,
        timezone,
        doors_open_at,
        is_recurring,
        ticketing_mode,
        max_capacity,
        is_age_restricted,
        min_age,
        refund_policy,
        meta_description, views_count, saves_count, likes_count,
        interests_count, booking_count, reviewed_by, reviewed_at,
        admin_notes, published_at, created_at, updated_at, host_page_id,
        vertical_poster_url,
        category:categories ( id, name, slug, icon_url, color_hex ),
        location:locations ( id, venue_name, address_line1, address_line2, city, state, country, google_maps_url ),
        host:users!events_host_id_fkey ( id, username, full_name, avatar_url, profile:host_pages!host_profiles_user_id_fkey ( id, display_name, organisation_name, tagline, logo_url, rating_avg ) ),
        ticket_tiers ( id, name, description, tier_type, price, currency, total_quantity, sold_count, max_per_booking, min_per_booking, sale_start_at, sale_end_at, perks, is_active ),
        tags:event_tags ( tag:tags ( id, name, slug ) ),
        cohosts:event_cohosts ( role, user:users ( id, full_name, username, avatar_url ) )
      `
      )
      .eq('slug', slugOrId)
      .maybeSingle()

    // If not found by slug, try by ID
    if (!data) {
      const res = await supabaseAdmin
        .from('events')
        .select(
          `
          id,
          slug,
          title,
          description,
          short_description,
          cover_image_url,
          event_type,
          online_platform,
          online_url_reveal,
          status,
          start_datetime,
          end_datetime,
          timezone,
          doors_open_at,
          is_recurring,
          ticketing_mode,
          max_capacity,
          is_age_restricted,
          min_age,
          refund_policy,
          meta_description, views_count, saves_count, likes_count,
          interests_count, booking_count, reviewed_by, reviewed_at,
          admin_notes, published_at, created_at, updated_at, host_page_id,
          vertical_poster_url,
          category:categories ( id, name, slug, icon_url, color_hex ),
          location:locations ( id, venue_name, address_line1, address_line2, city, state, country, google_maps_url ),
          host:users!events_host_id_fkey ( id, username, full_name, avatar_url, profile:host_pages!host_profiles_user_id_fkey ( id, display_name, organisation_name, tagline, logo_url, rating_avg ) ),
          ticket_tiers ( id, name, description, tier_type, price, currency, total_quantity, sold_count, max_per_booking, min_per_booking, sale_start_at, sale_end_at, perks, is_active ),
          tags:event_tags ( tag:tags ( id, name, slug ) ),
          cohosts:event_cohosts ( role, user:users ( id, full_name, username, avatar_url ) )
        `
        )
        .eq('id', slugOrId)
        .maybeSingle()

      data = res.data
      error = res.error
    }

    if (error) {
      console.error('API GET /api/events/[slug] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
