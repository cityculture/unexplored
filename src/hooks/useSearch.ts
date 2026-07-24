'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SearchFilters, buildSearchUrl, parseSearchParams } from '@/lib/utils/search'
import { VEventsPublic } from '@/types'

export function useSearch(initialFilters?: Partial<SearchFilters>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<SearchFilters>({
    ...parseSearchParams(searchParams),
    ...initialFilters,
  })

  const [results, setResults] = useState<VEventsPublic[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  // Sync state with URL params on mount or param change
  useEffect(() => {
    const params = parseSearchParams(searchParams)
    setFilters(prev => ({ ...prev, ...params }))
  }, [searchParams])

  const fetchResults = useCallback(async (currentFilters: SearchFilters, append = false) => {
    setLoading(true)
    setError(null)

    try {
      const queryString = buildSearchUrl(currentFilters)
      const response = await fetch(`/api/events/search${queryString}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }

      const data = await response.json()
      
      if (append) {
        setResults(prev => [...prev, ...data.events])
      } else {
        setResults(data.events)
      }
      
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during search')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced effect for keyword changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only fetch if q has changed or if first load
      fetchResults(filters)
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.q, filters.city, filters.category, filters.date_from, filters.date_to, filters.min_price, filters.max_price, filters.event_type])

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters, page: 1 } // Reset to page 1 on filter change
      
      // Update URL
      const queryString = buildSearchUrl(updated)
      router.push(`${pathname}${queryString}`, { scroll: false })
      
      return updated
    })
  }, [router, pathname])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = (filters.page || 1) + 1
      const updatedFilters = { ...filters, page: nextPage }
      setFilters(updatedFilters)
      fetchResults(updatedFilters, true)
      
      // Update URL for page sync
      const queryString = buildSearchUrl(updatedFilters)
      router.push(`${pathname}${queryString}`, { scroll: false })
    }
  }, [hasMore, loading, filters, fetchResults, router, pathname])

  return {
    filters,
    results,
    loading,
    error,
    total,
    hasMore,
    updateFilters,
    loadMore,
  }
}
