'use client'

import { useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { ConversationWithParticipants } from '../lib/repositories/messages.repository'

export function useRealtimeConversations(
  userId: string | undefined,
  onUpdate: (payload: ConversationWithParticipants) => void
) {
  useEffect(() => {
    if (!userId) return

    // Robust guard for realtime
    if (typeof window === 'undefined' || (typeof WebSocket !== 'function' && typeof globalThis.WebSocket !== 'function')) {
      return
    }

    const supabase = createClient()

    const channel1 = supabase.channel(`conversations-p1-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `participant_1_id=eq.${userId}` },
        (payload: { new: ConversationWithParticipants }) => onUpdate(payload.new)
      )
      .subscribe()

    const channel2 = supabase.channel(`conversations-p2-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `participant_2_id=eq.${userId}` },
        (payload: { new: ConversationWithParticipants }) => onUpdate(payload.new)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel1)
      supabase.removeChannel(channel2)
    }
  }, [userId, onUpdate])
}
