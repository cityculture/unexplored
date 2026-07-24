'use server'

import { createClient } from '../lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export async function reportContentAction(
  reportedType: string,
  reportedId: string,
  reason: string,
  details?: string
) {
  const supabase = await createClient()

  // Verify user authenticated
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Validate reportedType
  const allowedTypes = ['event', 'user', 'review', 'discussion', 'message']
  if (!allowedTypes.includes(reportedType)) {
    throw new Error(`Invalid reported_type. Must be one of: ${allowedTypes.join(', ')}`)
  }

  // Insert into reports table
  const { error } = await (supabase as AppSupabaseClient)
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_type: reportedType as 'event' | 'user' | 'review' | 'discussion' | 'message',
      reported_id: reportedId,
      reason,
      details: details || null,
      status: 'pending',
    })

  if (error) {
    throw new Error(`Failed to report content: ${error.message}`)
  }

  return { success: true }
}
