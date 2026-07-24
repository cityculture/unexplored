'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export async function toggleHostFollow(hostId: string) {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()

  if (!user) return { error: 'You must be logged in to follow a host' }

  // Check if already following
  const { data: existingFollow } = await (supabase as AppSupabaseClient)
    .from('host_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('host_id', hostId)
    .maybeSingle()

  if (existingFollow) {
    const { error } = await (supabase as AppSupabaseClient)
      .from('host_follows')
      .delete()
      .eq('id', existingFollow.id)

    if (error) return { error: error.message }
    revalidatePath(`/events`) // Revalidate paths where this might matter
    revalidatePath('/members/host-dashboard')
    return { success: true, action: 'unfollowed' }
  } else {
    const { error } = await (supabase as AppSupabaseClient)
      .from('host_follows')
      .insert({
        follower_id: user.id,
        host_id: hostId
      })

    if (error) return { error: error.message }
    revalidatePath(`/events`)
    revalidatePath('/members/host-dashboard')
    return { success: true, action: 'followed' }
  }
}

export async function toggleEventLike(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()

  if (!user) return { error: 'You must be logged in to like an event' }

  // Check if already liked
  const { data: existingLike } = await (supabase as AppSupabaseClient)
    .from('event_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .maybeSingle()

  if (existingLike) {
    const { error } = await (supabase as AppSupabaseClient)
      .from('event_likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    revalidatePath('/members/host-dashboard')
    return { success: true, action: 'unliked' }
  } else {
    const { error } = await (supabase as AppSupabaseClient)
      .from('event_likes')
      .insert({
        user_id: user.id,
        event_id: eventId
      })

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    revalidatePath('/members/host-dashboard')
    return { success: true, action: 'liked' }
  }
}

export async function toggleEventSave(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()

  if (!user) return { error: 'You must be logged in to save an event' }

  const { data: existingSave } = await (supabase as AppSupabaseClient)
    .from('event_saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .maybeSingle()

  if (existingSave) {
    const { error } = await (supabase as AppSupabaseClient)
      .from('event_saves')
      .delete()
      .eq('id', existingSave.id)

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    revalidatePath('/members/host-dashboard')
    return { success: true, action: 'unsaved' }
  } else {
    const { error } = await (supabase as AppSupabaseClient)
      .from('event_saves')
      .insert({
        user_id: user.id,
        event_id: eventId
      })

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    revalidatePath('/members/host-dashboard')
    return { success: true, action: 'saved' }
  }
}

export async function toggleEventInterest(eventId: string, type: 'interested' | 'going' | 'not_going' = 'interested') {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()

  if (!user) return { error: 'You must be logged in to show interest' }

  const { data: existingInterest } = await (supabase as AppSupabaseClient)
    .from('event_interests')
    .select('id, interest_type')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .maybeSingle()

  if (existingInterest) {
    if (existingInterest.interest_type === type) {
      // Toggle off if same type
      const { error } = await (supabase as AppSupabaseClient)
        .from('event_interests')
        .delete()
        .eq('id', existingInterest.id)

      if (error) return { error: error.message }
      revalidatePath(`/events/${eventId}`)
      revalidatePath('/members/host-dashboard')
      return { success: true, action: 'removed' }
    } else {
      // Update type
      const { error } = await (supabase as AppSupabaseClient)
        .from('event_interests')
        .update({ interest_type: type })
        .eq('id', existingInterest.id)

      if (error) return { error: error.message }
      revalidatePath(`/events/${eventId}`)
      revalidatePath('/members/host-dashboard')
      return { success: true, action: 'updated' }
    }
  } else {
    const { error } = await (supabase as AppSupabaseClient)
      .from('event_interests')
      .insert({
        user_id: user.id,
        event_id: eventId,
        interest_type: type
      })

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    revalidatePath('/members/host-dashboard')
    return { success: true, action: 'added' }
  }
}
