'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { toast } from 'sonner'

export function useRealtimeNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Fetch initial count
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then(({ count }: { count: number | null }) => {
        if (count !== null) setUnreadCount(count)
      })

    // Enhanced Robust guard for realtime
    const isWebSocketAvailable = typeof window !== 'undefined' && 
                                (typeof WebSocket === 'function' || typeof globalThis.WebSocket === 'function');
    
    if (!isWebSocketAvailable) {
      console.warn('[Realtime] Notifications skipped: WebSocket constructor not found in this environment.');
      return;
    }

    const channel = supabase.channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: { new: { title: string; body: string; action_url?: string } }) => {
          const notification = payload.new
          toast(notification.title, {
            description: notification.body,
            action: notification.action_url ? {
              label: 'View',
              onClick: () => {
                if (notification.action_url) window.location.href = notification.action_url;
              }
            } : undefined
          })
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { unreadCount, setUnreadCount }
}
