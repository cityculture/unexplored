'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'

export function useRealtimeFavorites(userId: string | undefined) {
  const [favoriteCount, setFavoriteCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Fetch initial count
    supabase
      .from('event_saves')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(({ count }: { count: number | null }) => {
        if (count !== null) setFavoriteCount(count)
      })

    const isWebSocketAvailable = typeof window !== 'undefined' && 
                                (typeof WebSocket === 'function' || typeof globalThis.WebSocket === 'function');
    
    if (!isWebSocketAvailable) return;

    const channel = supabase.channel(`favorites-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_saves',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Re-fetch count on any change (simpler than manual increment/decrement for deletes)
          supabase
            .from('event_saves')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .then(({ count }: { count: number | null }) => {
              if (count !== null) setFavoriteCount(count)
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { favoriteCount }
}
