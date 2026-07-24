'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export async function createDiscussionPost(formData: FormData) {
  const eventId = formData.get('eventId') as string
  const message = formData.get('message') as string
  const parentId = formData.get('parentId') as string | null
  const isAnonymous = formData.get('isAnonymous') === 'true'

  if (!message || message.trim().length === 0) {
    return { error: 'Message cannot be empty' }
  }

  const supabase = await createClient()
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to post a comment' }
  }

  const { error } = await (supabase as AppSupabaseClient)
    .from('event_discussions')
    .insert({
      event_id: eventId,
      user_id: user.id,
      message: message.trim(),
      parent_id: parentId || null,
      is_anonymous: isAnonymous
    })

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function toggleDiscussionLike(discussionId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()

  if (!user) return { error: 'You must be logged in to like a comment' }

  // Check if already liked
  const { data: existingLike } = await (supabase as AppSupabaseClient)
    .from('discussion_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('discussion_id', discussionId)
    .maybeSingle()

  if (existingLike) {
    const { error } = await (supabase as AppSupabaseClient)
      .from('discussion_likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    return { success: true, action: 'unliked' }
  } else {
    const { error } = await (supabase as AppSupabaseClient)
      .from('discussion_likes')
      .insert({
        user_id: user.id,
        discussion_id: discussionId
      })

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    return { success: true, action: 'liked' }
  }
}
