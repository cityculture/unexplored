export interface SearchFilters {
  q?: string
  city?: string
  category?: string
  date_from?: string
  date_to?: string
  min_price?: string
  max_price?: string
  event_type?: string
  page?: number
  pageSize?: number
}

/**
 * Serializes search filters into a URL query string
 */
export function buildSearchUrl(filters: SearchFilters): string {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value.toString())
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Parses URL search parameters into a SearchFilters object
 */
export function parseSearchParams(params: URLSearchParams): SearchFilters {
  return {
    q: params.get('q') || undefined,
    city: params.get('city') || undefined,
    category: params.get('category') || undefined,
    date_from: params.get('date_from') || undefined,
    date_to: params.get('date_to') || undefined,
    min_price: params.get('min_price') || undefined,
    max_price: params.get('max_price') || undefined,
    event_type: params.get('event_type') || undefined,
    page: params.get('page') ? parseInt(params.get('page')!, 10) : 1,
    pageSize: params.get('pageSize') ? parseInt(params.get('pageSize')!, 10) : 12,
  }
}
