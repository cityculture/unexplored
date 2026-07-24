'use server'

import { createClient } from '../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createHostPageSchema } from '../lib/validations/host.schemas'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export async function createHostPageAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = createHostPageSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid page details' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // 1. Insert into host_pages
  // Note: Uniqueness constraint was removed from database, so one user can have multiple pages.
  const { data: createdPage, error: insertError } = await (supabase as AppSupabaseClient).from('host_pages').insert({
    user_id: user.id,
    host_type: parsed.data.host_type as Database['public']['Tables']['host_pages']['Insert']['host_type'],
    display_name: parsed.data.display_name,
    tagline: parsed.data.tagline || null,
    description: parsed.data.description || null,
    website_url: parsed.data.website_url || null,
    instagram_handle: parsed.data.instagram_handle || null,
    city: parsed.data.city || (formData.get('city') as string) || null,
    state: parsed.data.state || (formData.get('state') as string) || null,
    country: parsed.data.country || (formData.get('country') as string) || null,
    is_approved: true, // Auto-approve for now or set to false if review required
    kyc_status: 'verified',
    slug: (parsed.data.display_name as string).toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7)
  }).select().single()

  if (insertError) {
    console.error('createHostPageAction insertion error:', insertError)
    return { error: insertError.message }
  }

  // 2. Update users table role to 'host' if not already
  await (supabase as AppSupabaseClient)
    .from('users')
    .update({ role: 'host' })
    .eq('id', user.id)

  revalidatePath('/members/dashboard')
  return { success: true, pageId: createdPage.id }
}

export async function updateHostPageAction(pageId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Ownership check
  const { data: existingPage } = await (supabase as AppSupabaseClient).from('host_pages').select('user_id').eq('id', pageId).single()
  if (!existingPage || existingPage.user_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const updates = {
    display_name: formData.get('display_name') as string,
    tagline: formData.get('tagline') as string || null,
    description: formData.get('description') as string || null,
    website_url: formData.get('website_url') as string || null,
    instagram_handle: formData.get('instagram_handle') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    country: formData.get('country') as string || null,
  }

  const { error: updateError } = await (supabase as AppSupabaseClient)
    .from('host_pages')
    .update(updates)
    .eq('id', pageId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/members/host-dashboard/${pageId}`)
  return { success: true }
}
