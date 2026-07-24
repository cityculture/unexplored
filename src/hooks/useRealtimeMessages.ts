'use client'

import { useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { MessageWithSender } from '../lib/repositories/messages.repository'

type PayloadMessage = {
  id: string
  conversation_id: string
  sender_id: string
  message_type: 'text' | 'image' | 'file' | 'system'
  content: string | null
  media_url: string | null
  is_read: boolean
  read_at: string | null
  is_deleted_by_sender: boolean
  is_deleted_by_receiver: boolean
  reply_to_message_id: string | null
  created_at: string
}

export function useRealtimeMessages(
  conversationId: string,
  onNewMessage: (msg: MessageWithSender) => void
) {
  useEffect(() => {
    if (!conversationId) return

    // Robust guard for realtime
    if (typeof window === 'undefined' || (typeof WebSocket !== 'function' && typeof globalThis.WebSocket !== 'function')) {
      return
    }

    const supabase = createClient()

    // Setup subscription
    const channel: RealtimeChannel = supabase.channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload: { new: PayloadMessage }) => {
          const newMsg = payload.new as PayloadMessage
          
          if (newMsg.is_deleted_by_sender) return
          
          // Need to fetch sender alias to match MessageWithSender
          const { data: sender } = await supabase
            .from('users')
            .select('anonymous_alias')
            .eq('id', newMsg.sender_id)
            .single()

          const messageWithSender: MessageWithSender = {
            ...newMsg,
            sender: sender ? { anonymous_alias: sender.anonymous_alias } : null
          }

          onNewMessage(messageWithSender)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, onNewMessage])
}
