import { PartnerConfig } from './partner-registry'

export interface NormalizedTier {
  external_tier_id: string
  name: string
  description: string | null
  tier_type: 'paid' | 'free'
  tier_category: string
  price: number
  currency: string
  total_quantity: number
  sold_count: number
  max_per_booking: number
  min_per_booking: number
  is_active: boolean
  sort_order: number
}

export interface NormalizedLocation {
  venue_name: string
  address_line1: string | null
  address_line2: string | null
  city: string
  state: string
  country: string
  country_code: string
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  google_maps_url: string | null
}

export interface NormalizedEvent {
  external_source: 'strangermingle' | 'saltymedia'
  external_event_id: string
  title: string
  slug: string
  host_id: string
  host_page_id: string
  category_slug: string
  location: NormalizedLocation | null
  short_description: string
  description: string
  cover_image_url: string | null
  vertical_poster_url: string | null
  event_type: 'in_person' | 'online' | 'hybrid'
  ticketing_mode: 'platform'
  status: 'published' | 'draft' | 'cancelled' | 'completed'
  start_datetime: string
  end_datetime: string
  timezone: string
  doors_open_at: string | null
  max_capacity: number
  booking_count: number
  is_age_restricted: boolean
  min_age: number
  refund_policy: string
  refund_policy_text: string | null
  is_featured: boolean
  is_sponsored: boolean
  tiers: NormalizedTier[]
}

const CATEGORY_MAP: Record<string, string> = {
  'meetups': 'meetups-networking',
  'music-concerts': 'music-concerts',
  'parties-nightlife': 'parties-nightlife',
  'workshops-classes': 'workshops-classes',
  'workshops': 'workshops-classes',
  'workshop': 'workshops-classes',
  'crash_course': 'workshops-classes',
  'webinar': 'workshops-classes',
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

function parseTimeToISO(dateStr: string, timeStr?: string): { start: string; end: string } {
  try {
    const baseDate = new Date(dateStr)
    if (isNaN(baseDate.getTime())) {
      const fallback = new Date()
      fallback.setDate(fallback.getDate() + 7)
      return { start: fallback.toISOString(), end: new Date(fallback.getTime() + 4 * 3600000).toISOString() }
    }

    if (!timeStr) {
      return {
        start: baseDate.toISOString(),
        end: new Date(baseDate.getTime() + 4 * 3600000).toISOString(),
      }
    }

    // Try parsing "09:30 AM" or "09:30"
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (match) {
      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const meridian = match[3]?.toUpperCase()

      if (meridian === 'PM' && hours < 12) hours += 12
      if (meridian === 'AM' && hours === 12) hours = 0

      baseDate.setHours(hours, minutes, 0, 0)
    }

    const start = baseDate.toISOString()
    const end = new Date(baseDate.getTime() + 4 * 3600000).toISOString()
    return { start, end }
  } catch {
    const now = new Date()
    return { start: now.toISOString(), end: new Date(now.getTime() + 4 * 3600000).toISOString() }
  }
}

/**
 * Normalizes an event payload from Stranger Mingle or Salty Media into City Culture's schema.
 */
export function normalizePartnerEvent(partner: PartnerConfig, raw: any): NormalizedEvent {
  const isSalty = partner.id === 'saltymedia'

  const externalId = String(raw.external_id || raw.id || '')
  const title = String(raw.title || 'Untitled Event').trim()

  // 1. Slug
  const baseSlug = (raw.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  const cleanSlug = `${baseSlug}-${externalId.substring(0, 6)}`

  // 2. Dates & Times
  let startDatetime: string
  let endDatetime: string

  if (raw.start_datetime) {
    startDatetime = new Date(raw.start_datetime).toISOString()
    endDatetime = raw.end_datetime ? new Date(raw.end_datetime).toISOString() : new Date(new Date(startDatetime).getTime() + 4 * 3600000).toISOString()
  } else if (raw.event_date) {
    const parsed = parseTimeToISO(raw.event_date, raw.start_time)
    startDatetime = parsed.start
    if (raw.end_time) {
      const parsedEnd = parseTimeToISO(raw.event_date, raw.end_time)
      endDatetime = parsedEnd.start
    } else {
      endDatetime = parsed.end
    }
  } else {
    const now = new Date()
    startDatetime = now.toISOString()
    endDatetime = new Date(now.getTime() + 4 * 3600000).toISOString()
  }

  // 3. Category
  let categorySlug = 'meetups-networking'
  if (isSalty) {
    categorySlug = 'workshops-classes'
  } else {
    const rawCat = (typeof raw.category === 'string' ? raw.category : raw.categories?.slug) || 'meetups'
    categorySlug = CATEGORY_MAP[rawCat.toLowerCase()] || 'meetups-networking'
  }

  // 4. Location
  let location: NormalizedLocation | null = null
  const loc = raw.locations || raw.location || raw.venue

  if (loc || raw.venue_name) {
    const venueName = loc?.venue_name || loc?.name || raw.venue_name || 'City Venue'
    const city = loc?.city || raw.venue_city || partner.defaultCity || 'Pune'
    location = {
      venue_name: venueName,
      address_line1: loc?.address_line1 || loc?.address || raw.venue_address || null,
      address_line2: loc?.address_line2 || null,
      city: city,
      state: loc?.state || 'Maharashtra',
      country: loc?.country || 'India',
      country_code: loc?.country_code || 'IN',
      postal_code: loc?.postal_code || null,
      latitude: loc?.latitude ? Number(loc.latitude) : null,
      longitude: loc?.longitude ? Number(loc.longitude) : null,
      google_maps_url: loc?.google_maps_url || raw.venue_map_url || null,
    }
  }

  // 5. Format & Event Type
  let eventType: 'in_person' | 'online' | 'hybrid' = 'in_person'
  if (raw.format === 'online' || raw.event_type === 'online' || raw.event_type === 'webinar') {
    eventType = 'online'
  } else if (raw.format === 'hybrid') {
    eventType = 'hybrid'
  }

  // 6. Doors Open
  let doorsOpenTime: string | null = null
  if (raw.doors_open_at) {
    if (typeof raw.doors_open_at === 'string' && raw.doors_open_at.includes('T')) {
      const match = raw.doors_open_at.match(/T(\d{2}:\d{2}:\d{2})/)
      doorsOpenTime = match ? match[1] : null
    } else {
      doorsOpenTime = raw.doors_open_at
    }
  }

  // 7. Ticket Tiers
  const rawTiers = raw.ticket_tiers || raw.tiers || []
  const tiers: NormalizedTier[] = rawTiers.map((t: any, index: number) => {
    const tierName = t.name || t.tier_name || `Tier ${index + 1}`
    const price = Number(t.price || 0)
    const tierType = t.tier_type || (price > 0 ? 'paid' : 'free')

    let tierCategory = 'General'
    const lowerName = tierName.toLowerCase()
    if (lowerName.includes('girl')) tierCategory = 'Girls'
    else if (lowerName.includes('boy')) tierCategory = 'Boys'
    else if (lowerName.includes('couple')) tierCategory = 'Couple'
    else if (lowerName.includes('early') || lowerName.includes('pass') || lowerName.includes('vip')) tierCategory = 'General'

    return {
      external_tier_id: String(t.id || `${externalId}-tier-${index}`),
      name: tierName,
      description: t.description || null,
      tier_type: tierType,
      tier_category: tierCategory,
      price: price,
      currency: t.currency || 'INR',
      total_quantity: Number(t.total_quantity || t.total_capacity || 30),
      sold_count: Number(t.sold_count || t.booked_count || 0),
      max_per_booking: Number(t.max_per_booking || 5),
      min_per_booking: Number(t.min_per_booking || 1),
      is_active: t.is_active !== false,
      sort_order: Number(t.sort_order || index),
    }
  })

  // 8. Default high-resolution fallback cover images if missing
  const defaultCoverUrl = isSalty
    ? 'https://res.cloudinary.com/difmfdika/image/upload/v1788743036/salty-media/assets/course/course-hero-banner.jpg'
    : 'https://res.cloudinary.com/city-culture/image/upload/v1773672200/event-posters/pending/mkylzfqmrzebzbupmoxr.jpg'

  const coverImageUrl = raw.cover_image_url || raw.vertical_poster_url || defaultCoverUrl
  const verticalPosterUrl = raw.vertical_poster_url || raw.cover_image_url || defaultCoverUrl

  // 9. Capacity & Booking Count Calculation
  const tierCapacity = tiers.reduce((s, t) => s + (t.total_quantity || 0), 0)
  const tierSold = tiers.reduce((s, t) => s + (t.sold_count || 0), 0)
  const maxCapacity = Number(raw.max_capacity || raw.total_capacity || tierCapacity || 30)
  const bookingCount = Math.max(Number(raw.booking_count || 0), tierSold)

  // 10. Description enrichment with instructor details if available
  let fullDesc = raw.description || raw.short_description || title
  if (raw.instructor_name && !fullDesc.includes(raw.instructor_name)) {
    fullDesc = `**Instructor: ${raw.instructor_name}**${raw.instructor_bio ? ` (${raw.instructor_bio})` : ''}\n\n` + fullDesc
  }

  return {
    external_source: partner.id,
    external_event_id: externalId,
    title: title,
    slug: cleanSlug,
    host_id: partner.hostUserId,
    host_page_id: partner.hostPageId,
    category_slug: categorySlug,
    location,
    short_description: raw.short_description || raw.title || '',
    description: fullDesc,
    cover_image_url: coverImageUrl,
    vertical_poster_url: verticalPosterUrl,
    event_type: eventType,
    ticketing_mode: 'platform',
    status: raw.status === 'upcoming' ? 'published' : (raw.status || 'published'),
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    timezone: raw.timezone || 'Asia/Kolkata',
    doors_open_at: doorsOpenTime,
    max_capacity: maxCapacity,
    booking_count: bookingCount,
    is_age_restricted: Boolean(raw.is_age_restricted),
    min_age: Number(raw.min_age || 0),
    refund_policy: raw.refund_policy || 'no_refund',
    refund_policy_text: raw.refund_policy_text || null,
    is_featured: raw.is_featured !== undefined ? Boolean(raw.is_featured) : true,
    is_sponsored: Boolean(raw.is_sponsored),
    tiers,
  }
}
