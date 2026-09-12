import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyFirebaseToken } from '@/lib/firebase/verify-token'
import { v5 as uuidv5 } from 'uuid'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    const decoded = await verifyFirebaseToken(idToken)
    const supabaseUid = uuidv5(decoded.uid, FIREBASE_NAMESPACE)

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(
        `
        id, username, full_name, email, phone, phone_verified,
        avatar_url, bio, gender, date_of_birth, role,
        is_verified, is_active, created_at, updated_at,
        host_type, organisation_name, kyc_status,
        bank_account_verified, bank_account_name, bank_account_number, bank_ifsc,
        website_url, facebook_url, instagram_handle, twitter_handle, youtube_url,
        follower_count, total_events_hosted, is_approved,
        subscriptions:subscriptions(*)
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

    return NextResponse.json({
      user: {
        ...data,
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
    const decoded = await verifyFirebaseToken(idToken)
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
