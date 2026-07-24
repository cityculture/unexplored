import { createClient } from '../supabase/server'
import { Database } from '../../types/database.types'

type ConversationRow = Database['public']['Tables']['conversations']['Row']
type MessageRow = Database['public']['Tables']['messages']['Row']

export type ConversationWithParticipants = ConversationRow & {
  other_participant: {
    anonymous_alias: string
  } | null
}

export type MessageWithSender = MessageRow & {
  sender: {
    anonymous_alias: string
  } | null
}

export async function getConversations(userId: string): Promise<ConversationWithParticipants[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, participant_1_id, participant_2_id, context_event_id,
      last_message_at, last_message_preview,
      is_muted_by_p1, is_muted_by_p2, is_blocked_by_p1, is_blocked_by_p2,
      created_at,
      p1:participant_1_id (anonymous_alias),
      p2:participant_2_id (anonymous_alias)
    `)
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`)
  }

interface JoinedConversation extends ConversationRow {
  p1: { anonymous_alias: string } | null
  p2: { anonymous_alias: string } | null
}

  // Format response to always expose the "other" participant's alias
  return (data || []).map((conv: unknown) => {
    const c = conv as (JoinedConversation & { p1_deleted_at?: string | null; p2_deleted_at?: string | null })
    const isP1 = c.participant_1_id === userId
    const otherParticipant = isP1 ? c.p2 : c.p1

    return {
      id: c.id,
      participant_1_id: c.participant_1_id,
      participant_2_id: c.participant_2_id,
      context_event_id: c.context_event_id,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      is_muted_by_p1: c.is_muted_by_p1,
      is_muted_by_p2: c.is_muted_by_p2,
      is_blocked_by_p1: c.is_blocked_by_p1,
      is_blocked_by_p2: c.is_blocked_by_p2,
      created_at: c.created_at,
      p1_deleted_at: c.p1_deleted_at || null,
      p2_deleted_at: c.p2_deleted_at || null,
      other_participant: otherParticipant,
    }
  })
}

export async function getMessages(conversationId: string, userId: string): Promise<MessageWithSender[]> {
  const supabase = await createClient()

  // Verify participation first to ensure security
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .single()

  if (convError || !conv) {
    throw new Error('Not authorized to view messages in this conversation')
  }

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(anonymous_alias)
    `)
    .eq('conversation_id', conversationId)
    .eq('is_deleted_by_sender', false) // assuming if receiver deletes we might have complex logic, but we follow requirement
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`)
  }

  interface JoinedMessage extends MessageRow {
    sender: { anonymous_alias: string } | { anonymous_alias: string }[] | null
  }

  // Clean data structure returned by PostgREST
  return (data || []).map((msg: unknown) => {
    const m = msg as JoinedMessage
    return {
      ...m,
      sender: Array.isArray(m.sender) ? m.sender[0] : m.sender,
    }
  })
}
