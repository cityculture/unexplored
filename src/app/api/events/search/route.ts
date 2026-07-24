import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VEventsPublic } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')
  const city = searchParams.get('city')
  const category = searchParams.get('category') // slug
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')
  const min_price = searchParams.get('min_price')
  const max_price = searchParams.get('max_price')
  const event_type = searchParams.get('event_type')
  const past = searchParams.get('past') === 'true'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)

  const supabase = await createClient()

  let query = supabase
    .from('v_events_public')
    .select('*', { count: 'exact' })
    .eq('status', 'published')

  // Handle upcoming vs past events
  if (!past) {
    query = query.gte('start_datetime', new Date().toISOString())
  }

  // Filters
  if (q) {
    // Assuming 'fts' column exists after migration
    query = query.textSearch('fts', q, {
      config: 'english',
      type: 'websearch',
    })
  }

  if (city) {
    query = query.ilike('city', city)
  }

  if (category) {
    query = query.eq('category_slug', category)
  }

  if (date_from) {
    query = query.gte('start_datetime', date_from)
  }

  if (date_to) {
    query = query.lte('start_datetime', date_to)
  }

  if (min_price) {
    query = query.gte('min_price', parseFloat(min_price))
  }

  if (max_price) {
    const maxPriceVal = parseFloat(max_price)
    // Complex OR filter for max price or free/rsvp events
    query = query.or(`max_price.lte.${maxPriceVal},ticketing_mode.in.(free,rsvp)`)
  }

  if (event_type) {
    query = query.eq('event_type', event_type)
  }

  // Sorting
  query = query
    .order('is_featured', { ascending: false })
    .order('is_sponsored', { ascending: false })
    .order('start_datetime', { ascending: true })

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Search API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = count || 0
  const hasMore = total > page * pageSize

  return NextResponse.json({
    events: data || [],
    total,
    page,
    pageSize,
    hasMore,
  })
}
