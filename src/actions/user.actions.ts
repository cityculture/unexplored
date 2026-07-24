'use server'

import { createClient } from '../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Json } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

// Note: A robust implementation would use a Zod schema here, 
// but we'll accept the structured data from the client component which handles validation
export async function updateProfileAction(formData: FormData) {
  const username = formData.get('username') as string
  const bio = formData.get('bio') as string
  const avatar_url = formData.get('avatar_url') as string
  const preferred_currency = formData.get('preferred_currency') as string
  const timezone = formData.get('timezone') as string
  const phone = formData.get('phone') as string
  const gender = formData.get('gender') as string
  const date_of_birth = formData.get('date_of_birth') as string
  const preferred_language = formData.get('preferred_language') as string
  const role = formData.get('role') as string
  const full_name = formData.get('full_name') as string

  // basic validation 
  if (!username || username.length < 3 || username.length > 50) {
    return { error: 'Username must be between 3 and 50 characters' }
  }

  if (role && !['member', 'host'].includes(role)) {
    return { error: 'Invalid role selected' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Check username uniqueness if they are changing it
  const { data: existingUser } = await (supabase as AppSupabaseClient)
    .from('users')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()
    
  if (existingUser) {
    return { error: 'Username is already taken' }
  }

  const { error: updateError } = await (supabase as AppSupabaseClient)
    .from('users')
    .update({
      username,
      role: (role as Database['public']['Tables']['users']['Update']['role']) || undefined,
      bio: bio || null,
      avatar_url: avatar_url || null,
      preferred_currency: preferred_currency || null,
      timezone: timezone || null,
      phone: phone || null,
      gender: gender || null,
      date_of_birth: date_of_birth || null,
      preferred_language: preferred_language || null,
      full_name: full_name || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  // If role is host, ensure host_profile exists
  if (role === 'host') {
     const { data: existingHost } = await (supabase as AppSupabaseClient)
        .from('host_pages')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
     
     if (!existingHost) {
        await (supabase as AppSupabaseClient).from('host_pages').insert({
            user_id: user.id,
            display_name: username,
            host_type: 'individual',
            total_events_hosted: 0
        })
     }
  }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  revalidatePath('/members/dashboard')
  revalidatePath('/members/profile')

  return { success: true }
}

const VALID_NOTIFICATION_TYPES = [
  'booking_confirmed',
  'booking_cancelled',
  'payment_failed',
  'event_reminder_24h',
  'event_reminder_1h',
  'event_cancelled',
  'new_message',
  'waitlist_offer',
  'new_event_from_followed_host',
  'review_received',
  'host_response_received',
  'saved_search_alert'
];

export async function updateNotificationPrefsAction(prefs: Record<string, Json>) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Validate keys
  const keys = Object.keys(prefs);
  const invalidKeys = keys.filter(k => !VALID_NOTIFICATION_TYPES.includes(k));
  if (invalidKeys.length > 0) {
    return { error: `Invalid notification types: ${invalidKeys.join(', ')}` };
  }

  // Fetch current prefs to merge
  const { data: currentUser, error: fetchError } = await (supabase as AppSupabaseClient)
    .from('users')
    .select('notification_prefs')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    return { error: 'Failed to fetch current preferences' };
  }

  const currentPrefs = (currentUser?.notification_prefs as Record<string, Json>) || {};
  
  // Merge granularly
  const mergedPrefs = { ...currentPrefs };
  for (const [type, channels] of Object.entries(prefs)) {
    const existingChannels = (mergedPrefs[type] as Record<string, boolean>) || { in_app: true, email: true };
    const newChannels = channels as Record<string, boolean>;
    mergedPrefs[type] = {
      ...existingChannels,
      ...newChannels
    } as Json;
  }

  const { error: updateError } = await (supabase as AppSupabaseClient)
    .from('users')
    .update({
      notification_prefs: mergedPrefs as Json,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/settings/notifications')
  return { success: true }
}

export async function markNotificationAsReadAction(notificationId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Unauthorized' }

  const { error } = await (supabase as AppSupabaseClient)
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  
  revalidatePath('/members/notifications')
  return { success: true }
}

export async function markAllNotificationsAsReadAction() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Unauthorized' }

  const { error } = await (supabase as AppSupabaseClient)
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { error: error.message }
  
  revalidatePath('/members/notifications')
  return { success: true }
}
