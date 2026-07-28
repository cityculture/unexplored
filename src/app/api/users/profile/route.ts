import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { firebaseAdminAuth } from '@/lib/firebase/admin'
import { v5 as uuidv5 } from 'uuid'

const FIREBASE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decoded = await firebaseAdminAuth.verifyIdToken(idToken)
    const supabaseUid = uuidv5(decoded.uid, FIREBASE_NAMESPACE)

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(
        `
        id, username, full_name, anonymous_alias, email, phone, phone_verified,
        avatar_url, bio, gender, date_of_birth, role,
        is_verified, is_active, created_at, updated_at,
        subscriptions:subscriptions(*),
        host_profile:host_pages!host_profiles_user_id_fkey (
          id, user_id, host_type, display_name, organisation_name, tagline,
          description, website_url, instagram_handle, logo_url, banner_url,
          city, state, country, is_approved, follower_count, rating_avg, rating_count
        )
      `
      )
      .eq('id', supabaseUid)
      .maybeSingle()

    if (error) {
      console.error('API GET /api/users/profile Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const profile = Array.isArray(data.host_profile) ? data.host_profile[0] : data.host_profile

    return NextResponse.json({
      user: {
        ...data,
        host_profile: profile || null,
        subscriptions: data.subscriptions || [],
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decoded = await firebaseAdminAuth.verifyIdToken(idToken)
    const supabaseUid = uuidv5(decoded.uid, FIREBASE_NAMESPACE)

    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supabaseUid)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
