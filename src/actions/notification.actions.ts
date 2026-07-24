'use server'

import { createClient } from '../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export async function markAsReadAction(notificationId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error: updateError } = await (supabase as AppSupabaseClient)
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}

export async function markAllReadAction() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error: updateError } = await (supabase as AppSupabaseClient)
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/notifications')
  return { success: true }
}
