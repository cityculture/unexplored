import { createClient } from '../supabase/server'
import { Database } from '@/types/database.types'
import {
  PaginatedResponse,
  EventWithDetails,
} from '@/types/api.types'
import {
  EventInsert,
  EventUpdate,
  Event,
} from '@/types'

export interface EventFilters {
  city?: string
  categorySlug?: string
  dateFrom?: string
  dateTo?: string
  maxPrice?: number
  keyword?: string
  page: number
  pageSize: number
}

export async function getPublishedEvents(
  filters: EventFilters
): Promise<PaginatedResponse<EventWithDetails>> {
  const supabase = await createClient()

  let query = supabase
    .from('v_events_public')
    .select(
      `
      id,
      slug,
      title,
      short_description,
      cover_image_url,
      event_type,
      start_datetime,
      end_datetime,
      timezone,
      status,
      is_featured,
      ticketing_mode,
      views_count,
      likes_count,
      interests_count,
      booking_count,
      category_name,
      category_slug,
      category_color,
      city,
      state,
      country,
      venue_name,
      host_username,
      host_display_name,
      host_logo,
      min_price,
      max_price,
      vertical_poster_url
    `,
      { count: 'exact' }
    )

  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`)
  }
  if (filters.categorySlug) {
    query = query.eq('category_slug', filters.categorySlug)
  }
  if (filters.dateFrom) {
    query = query.gte('start_datetime', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('start_datetime', filters.dateTo)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('min_price', filters.maxPrice)
  }
  if (filters.keyword) {
    query = query.ilike('title', `%${filters.keyword}%`) // Using ilike since to_tsvector is on the events table itself
  }

  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  query = query
    .order('is_featured', { ascending: false })
    .order('start_datetime', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: {
      items: data as unknown as EventWithDetails[],
      total: count || 0,
      page: filters.page,
      pageSize: filters.pageSize,
    },
    error: null,
  }
}

export async function getEventBySlug(
  slug: string
): Promise<EventWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
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
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(error.message)
  }

  return data as unknown as EventWithDetails
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id, host_id, category_id, location_id, title, slug,
      description, short_description, cover_image_url, event_type,
      online_platform, online_event_url, online_url_reveal, status,
      cancellation_reason, cancelled_at, cancelled_by, start_datetime,
      end_datetime, timezone, doors_open_at, is_recurring,
      recurrence_rule, recurrence_end_date, parent_event_id,
      ticketing_mode, external_ticket_url, max_capacity,
      is_age_restricted, min_age, refund_policy, refund_policy_text,
      refund_cutoff_hours, is_featured, is_sponsored, sponsor_expires_at,
      meta_title, meta_description, views_count, saves_count, likes_count,
      interests_count, booking_count, reviewed_by, reviewed_at,
      admin_notes, published_at, created_at, updated_at
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(error.message)
  }

  return data as unknown as Event
}

export async function createEvent(eventData: EventInsert): Promise<Event> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select(
      `
      id, host_id, category_id, location_id, title, slug,
      description, short_description, cover_image_url, event_type,
      online_platform, online_event_url, online_url_reveal, status,
      cancellation_reason, cancelled_at, cancelled_by, start_datetime,
      end_datetime, timezone, doors_open_at, is_recurring,
      recurrence_rule, recurrence_end_date, parent_event_id,
      ticketing_mode, external_ticket_url, max_capacity,
      is_age_restricted, min_age, refund_policy, refund_policy_text,
      refund_cutoff_hours, is_featured, is_sponsored, sponsor_expires_at,
      meta_title, meta_description, views_count, saves_count, likes_count,
      interests_count, booking_count, reviewed_by, reviewed_at,
      admin_notes, published_at, created_at, updated_at
    `
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as Event
}

export async function updateEvent(
  id: string,
  eventData: EventUpdate
): Promise<Event> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select(
      `
      id, host_id, category_id, location_id, title, slug,
      description, short_description, cover_image_url, event_type,
      online_platform, online_event_url, online_url_reveal, status,
      cancellation_reason, cancelled_at, cancelled_by, start_datetime,
      end_datetime, timezone, doors_open_at, is_recurring,
      recurrence_rule, recurrence_end_date, parent_event_id,
      ticketing_mode, external_ticket_url, max_capacity,
      is_age_restricted, min_age, refund_policy, refund_policy_text,
      refund_cutoff_hours, is_featured, is_sponsored, sponsor_expires_at,
      meta_title, meta_description, views_count, saves_count, likes_count,
      interests_count, booking_count, reviewed_by, reviewed_at,
      admin_notes, published_at, created_at, updated_at
    `
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as Event
}

export async function incrementViewCount(id: string): Promise<void> {
  // Using RPC to increment atomcally via service_role to bypass RLS potentially, or standard RPC
  // Alternatively, since RPC definition may not be documented, we fetch and update. 
  // IMPORTANT: Doing fetch then update isn't atomic, but for views it's acceptable if no increment RPC exists.
  
  const supabase = await createClient()

  // First fetch current views
  const { data, error: fetchError } = await supabase
    .from('events')
    .select('views_count')
    .eq('id', id)
    .single()

  if (fetchError || !data) return // silently fail increments

  const { error: updateError } = await supabase
    .from('events')
    .update({ views_count: (data.views_count || 0) + 1 })
    .eq('id', id)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

export async function getSavedEvents(userId: string): Promise<EventWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_saves')
    .select(`
      event_id,
      event:v_events_public (*)
    `)
    .eq('user_id', userId)

  if (error) return []
  
  return (data || []).map(d => d.event) as unknown as EventWithDetails[]
}

export async function getRelatedEvents(
  currentEventId: string,
  city: string,
  limit: number = 4
): Promise<EventWithDetails[]> {
  const supabase = await createClient()

  // 1st Priority: Same city, excluding current event
  const { data: sameCityEvents, error: cityError } = await supabase
    .from('v_events_public')
    .select('*')
    .eq('status', 'published')
    .eq('city', city)
    .neq('id', currentEventId)
    .order('start_datetime', { ascending: true })
    .limit(limit)

  if (cityError) throw new Error(cityError.message)

  let results = sameCityEvents as unknown as EventWithDetails[]

  // 2nd Priority: Other cities if limit not reached
  if (results.length < limit) {
    const { data: otherEvents, error: otherError } = await supabase
      .from('v_events_public')
      .select('*')
      .eq('status', 'published')
      .neq('city', city)
      .neq('id', currentEventId)
      .order('start_datetime', { ascending: true })
      .limit(limit - results.length)

    if (otherError) throw new Error(otherError.message)
    results = [...results, ...(otherEvents as unknown as EventWithDetails[])]
  }

  return results
}
