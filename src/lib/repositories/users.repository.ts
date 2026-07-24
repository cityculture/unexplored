import { createClient } from '../supabase/server'
import { UserUpdate, User, HostProfile, Subscription } from '@/types'

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id, username, full_name, anonymous_alias, email, phone, phone_verified,
      password_hash, avatar_url, bio, gender, date_of_birth, role,
      is_verified, is_active, is_suspended, suspension_reason,
      suspended_until, email_verified_at, last_login_at, login_count,
      preferred_language, preferred_currency, timezone,
      notification_prefs, privacy_settings, created_at, updated_at
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return data
}

export async function getUserWithHostProfile(
  id: string
): Promise<User & { host_profile: HostProfile | null; subscriptions: Subscription[] }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id, username, full_name, anonymous_alias, email, phone, phone_verified,
      password_hash, avatar_url, bio, gender, date_of_birth, role,
      is_verified, is_active, is_suspended, suspension_reason,
      suspended_until, email_verified_at, last_login_at, login_count,
      preferred_language, preferred_currency, timezone,
      notification_prefs, privacy_settings, created_at, updated_at,
      subscriptions:subscriptions(*),
      host_profile:host_pages!host_profiles_user_id_fkey (
        id, user_id, host_type, display_name, organisation_name, tagline,
        description, website_url, instagram_handle, facebook_url,
        twitter_handle, youtube_url, logo_url, banner_url, city, state,
        country, is_approved, approved_by, approved_at, kyc_status,
        kyc_documents, razorpay_account_id, razorpay_contact_id,
        bank_account_verified, total_events_hosted, total_tickets_sold,
        total_revenue, follower_count, rating_avg, rating_count,
        created_at, updated_at
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Next/Supabase returns host_profile as an array for 1-to-1 if not explicitly single
  // so we safely unpack it
  const profile = Array.isArray(data.host_profile)
    ? data.host_profile[0]
    : data.host_profile

  return {
    ...data,
    host_profile: profile || null,
    subscriptions: data.subscriptions || []
  } as unknown as User & { host_profile: HostProfile | null; subscriptions: Subscription[] }
}

export async function updateUser(id: string, userData: UserUpdate): Promise<User> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select(
      `
      id, username, full_name, anonymous_alias, email, phone, phone_verified,
      password_hash, avatar_url, bio, gender, date_of_birth, role,
      is_verified, is_active, is_suspended, suspension_reason,
      suspended_until, email_verified_at, last_login_at, login_count,
      preferred_language, preferred_currency, timezone,
      notification_prefs, privacy_settings, created_at, updated_at
    `
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
