'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../lib/validations/auth.schemas'
import { supabaseAdmin } from '../lib/supabase/admin'
import crypto from 'crypto'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export async function loginAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = loginSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Invalid login details' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    console.error('Login error:', error.message, error.status)
    // Clearer error for unconfirmed email
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Please confirm your email address before logging in. Check your inbox for a verification link.' }
    }
    return { error: error.message }
  }

  revalidatePath('/')
  redirect('/members/dashboard')
}

export async function registerAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = registerSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid registration details' }
  }

  const { email, password, full_name, phone, gender, date_of_birth } = parsed.data

  const supabase = await createClient()

  // 1. Generate unique username from full_name
  let username = full_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 30)
  
  if (!username) username = 'user'

  // Check uniqueness and append random numbers if needed
  let isUnique = false
  let finalUsername = username
  let attempts = 0
  
  while (!isUnique && attempts < 10) {
    const { data: existing } = await (supabaseAdmin as AppSupabaseClient)
      .from('users')
      .select('id')
      .eq('username', finalUsername)
      .maybeSingle()
    
    if (!existing) {
      isUnique = true
    } else {
      finalUsername = `${username}${Math.floor(Math.random() * 10000)}`
      attempts++
    }
  }

  // 2. Sign up the user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Failed to create account.' }
  }

  // 3. Generate anonymous_alias 
  const adjectives = ['Blue', 'Red', 'Quick', 'Happy', 'Clever', 'Brave', 'Wild', 'Calm']
  const animals = ['Fox', 'Bear', 'Wolf', 'Owl', 'Hawk', 'Lion', 'Tiger', 'Seal']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  const anonymous_alias = `${adj}${animal}${num}`

  // 4. Insert into our custom public.users table
  const password_hash = hashPassword(password)
  
  const { error: insertError } = await (supabaseAdmin as AppSupabaseClient).from('users').insert({
    id: authData.user.id,
    username: finalUsername,
    full_name,
    email,
    phone,
    gender,
    date_of_birth,
    anonymous_alias,
    password_hash,
  })

  if (insertError) {
    console.error('Failed to initialize profile. Error:', insertError)
    return { error: 'User account created but failed to initialize profile.' }
  }

  return { success: true }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function forgotPasswordAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = forgotPasswordSchema.safeParse(data)

  if (!parsed.success) {
    // Return early but keeping success: true simulates email exists for security
    return { success: true }
  }

  const email = parsed.data.email

  try {
    // 1. Get user ID from our public users table
    const { data: user } = await (supabaseAdmin as AppSupabaseClient)
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (user) {
      // 2. Generate recovery link via Admin Auth API
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
        }
      })

      if (!linkError && linkData?.properties?.action_link) {
        // 3. Trigger our custom Resend-based Edge Function
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const functionUrl = `${baseUrl}/functions/v1/send-email`
        
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            recipient_email: email,
            user_id: user.id,
            subject: 'Reset Your Password — City Culture',
            body: `We received a request to reset your password for your City Culture account. Click the button below to choose a new password.`,
            action_url: linkData.properties.action_link
          })
        })
      }
    }
  } catch (err) {
    // Log error but don't expose to client
    console.error('forgotPasswordAction custom flow error:', err)
  }

  // Never reveal if email exists or not
  return { success: true }
}

export async function updatePasswordAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = resetPasswordSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid password details' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  // Sync password_hash in public.users
  const user = (await supabase.auth.getUser()).data.user
  if (user) {
    const password_hash = hashPassword(parsed.data.password)
    await supabaseAdmin.from('users').update({
      password_hash,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
  }

  return { success: true }
}

export async function checkUsernameAction(username: string) {
  const supabase = await createClient()
  const { data } = await (supabase as AppSupabaseClient)
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (data) {
    return { available: false }
  }
  return { available: true }
}
