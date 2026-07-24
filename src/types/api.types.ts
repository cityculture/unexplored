import {
  Booking,
  BookingItem,
  Category,
  Event,
  HostProfile,
  Location,
  TicketTier,
  User,
} from './index'

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  total: number
  page: number
  pageSize: number
}>

/**
 * EventWithDetails combines the non-nullable base Event table columns
 * with the view-computed fields from v_events_public (which are nullable).
 * This ensures core fields like title, slug, start_datetime remain non-null
 * while aggregated/joined fields like min_price, category_name are nullable.
 */
export type EventWithDetails = Event & {
  // View-computed fields from v_events_public
  min_price?: number | null
  max_price?: number | null
  category_name?: string | null
  category_slug?: string | null
  category_color?: string | null
  host_display_name?: string | null
  host_logo?: string | null
  host_username?: string | null
  venue_name?: string | null
  city?: string | null
  country?: string | null
  state?: string | null

  // Flattened location fields
  address_line_1?: string | null
  address_line_2?: string | null
  postal_code?: string | null
  google_maps_url?: string | null
  latitude?: number | null
  longitude?: number | null

  // Joined relations
  category?: Category | null
  location?: Location | null
  host?: (User & { profile: HostProfile | null }) | null
  ticket_tiers?: TicketTier[]
  tags?: { tag: { id: string, name: string, slug: string } }[]
  cohosts?: { role: string, user: { id: string, full_name: string | null, username: string, avatar_url: string | null } }[]
}

export type BookingWithItems = Booking & {
  items: BookingItem[]
  ticket_tiers: TicketTier[]
}

export type HostWithDetails = HostProfile & {
  user: User | null
  follower_count: number
  event_count: number
  is_following?: boolean
  events?: EventWithDetails[]
}
