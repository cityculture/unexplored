import { NextResponse } from 'next/server'
import { firebaseAdminAuth } from '@/lib/firebase/admin'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendResendEmail } from '@/lib/resend'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { v5 as uuidv5 } from 'uuid'

const FIREBASE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
type AppSupabaseClient = SupabaseClient<Database>

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { idToken, email: providedEmail, full_name, avatar_url } = payload

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 })
    }

    // 1. Verify Firebase ID Token on server
    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid
    const supabaseUid = uuidv5(uid, FIREBASE_NAMESPACE)
    const email = decodedToken.email || providedEmail

    if (!email) {
      return NextResponse.json({ error: 'No email address associated with Firebase user.' }, { status: 400 })
    }

    // 2. Check if user already exists in public.users table
    const { data: existingUser } = await (supabaseAdmin as AppSupabaseClient)
      .from('users')
      .select('id, email, username, full_name')
      .or(`id.eq.${supabaseUid},email.eq.${email}`)
      .maybeSingle()

    if (existingUser) {
      // User exists - update last active timestamp / details
      await (supabaseAdmin as AppSupabaseClient)
        .from('users')
        .update({
          updated_at: new Date().toISOString(),
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq('id', existingUser.id)

      // Trigger login notification email via Resend
      await sendResendEmail({
        to: email,
        recipient_name: existingUser.full_name || existingUser.username || 'Member',
        subject: 'Security Alert: New Sign-In to City Culture',
        body: `We noticed a new sign-in to your City Culture account (${email}) on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST. If this was you, no action is needed.`,
      })

      return NextResponse.json({ success: true, isNew: false, userId: existingUser.id })
    }

    // 3. New User - Create unique username and anonymous alias
    const nameSeed = full_name || email.split('@')[0] || 'member'
    let baseUsername = nameSeed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25)
    if (!baseUsername) baseUsername = 'member'

    let isUnique = false
    let finalUsername = baseUsername
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const { data: check } = await (supabaseAdmin as AppSupabaseClient)
        .from('users')
        .select('id')
        .eq('username', finalUsername)
        .maybeSingle()

      if (!check) {
        isUnique = true
      } else {
        finalUsername = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`
        attempts++
      }
    }

    const adjectives = ['Blue', 'Red', 'Quick', 'Happy', 'Clever', 'Brave', 'Wild', 'Calm']
    const animals = ['Fox', 'Bear', 'Wolf', 'Owl', 'Hawk', 'Lion', 'Tiger', 'Seal']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const animal = animals[Math.floor(Math.random() * animals.length)]
    const num = Math.floor(1000 + Math.random() * 9000)
    const anonymous_alias = `${adj}${animal}${num}`

    // 4. Insert into public.users
    const { error: insertError } = await (supabaseAdmin as AppSupabaseClient).from('users').insert({
      id: supabaseUid,
      email: email,
      username: finalUsername,
      full_name: full_name || baseUsername,
      avatar_url: avatar_url || null,
      anonymous_alias,
      role: 'member',
    })

    if (insertError) {
      console.error('Failed to create profile in users table:', insertError)
      return NextResponse.json({ error: 'Failed to complete user registration profile.' }, { status: 500 })
    }

    // 5. Send Welcome Email via Resend
    await sendResendEmail({
      to: email,
      recipient_name: full_name || finalUsername,
      subject: 'Welcome to City Culture! 🎉',
      body: `Welcome to City Culture! We're thrilled to have you join our community. Explore curated events, connect with fellow members, and discover unforgettable experiences in your city.`,
      action_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cityculture.in'}/members/dashboard`,
      action_text: 'Explore City Culture',
    })

    return NextResponse.json({ success: true, isNew: true, userId: supabaseUid })
  } catch (err: any) {
    console.error('API /api/auth/sync Error:', err)
    return NextResponse.json({ error: err?.message || 'Authentication synchronization failed' }, { status: 500 })
  }
}
