'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createRazorpaySubscription } from '@/lib/razorpay/createSubscription'
import { env } from '@/lib/env_server'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

type AppSupabaseClient = SupabaseClient<Database>

export async function createSubscriptionAction(
  pageId: string,
  planType: 'monthly' | 'yearly',
  paymentIdOrSubId: string,
  isRecurring: boolean = false
) {
  if (!paymentIdOrSubId || (paymentIdOrSubId === 'MOCK_PAYMENT_ID' && process.env.NODE_ENV === 'production')) {
     console.error('❌ Missing payment/subscription ID')
     return { error: 'Invalid payment session' }
  }
  const supabase = await createClient()

  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const amount = planType === 'monthly' ? 49 : 499
  const durationDays = planType === 'monthly' ? 30 : 365

  const startsAt = new Date()
  const endsAt = new Date()
  endsAt.setDate(startsAt.getDate() + durationDays)

  // Idempotency check: Don't record same transaction twice
  if (isRecurring) {
    const { data: existingSub } = await (supabase as AppSupabaseClient)
      .from('subscriptions')
      .select('id')
      .eq('razorpay_subscription_id', paymentIdOrSubId)
      .maybeSingle()
    if (existingSub) return { success: true }
  } else {
    const { data: existingPay } = await (supabase as AppSupabaseClient)
      .from('subscriptions')
      .select('id')
      .eq('razorpay_payment_id', paymentIdOrSubId)
      .maybeSingle()
    if (existingPay) return { success: true }
  }

  const insertData: Database['public']['Tables']['subscriptions']['Insert'] = {
    user_id: user.id,
    host_page_id: pageId,
    plan_type: planType,
    amount: amount,
    currency: 'INR',
    status: 'active',
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    razorpay_payment_id: isRecurring ? null : paymentIdOrSubId,
    razorpay_subscription_id: isRecurring ? paymentIdOrSubId : null
  }

  const { error } = await (supabase as AppSupabaseClient)
    .from('subscriptions')
    .insert(insertData)

  if (error) {
    console.error('createSubscriptionAction error:', error)
    return { error: error.message || 'Failed to record subscription' }
  }

  revalidatePath('/members/dashboard')
  revalidatePath(`/members/host-dashboard/${pageId}`)
  revalidatePath(`/members/host-dashboard/${pageId}/create-event`)
  revalidatePath('/')
  
  console.log(`✅ Subscription recorded for page ${pageId}, user ${user.id}`)

  // Trigger "Thanks" Email
  try {
    const { data: hostPage } = await (supabase as AppSupabaseClient)
      .from('host_pages')
      .select('display_name')
      .eq('id', pageId)
      .single()

    const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${baseUrl}/functions/v1/send-email`;

    const emailPayload = {
      user_id: user.id,
      subject: `Subscription Activated: ${planType.toUpperCase()}`,
      body: `Your host subscription for <strong>${hostPage?.display_name || 'your page'}</strong> has been activated successfully!`,
      action_url: `${env.NEXT_PUBLIC_SITE_URL}/members/host-dashboard/${pageId}`,
      meta_data: {
        total: amount,
        ref: paymentIdOrSubId,
        items: [{
          name: `Host Plan (${planType})`,
          quantity: 1,
          price: amount.toFixed(2)
        }]
      }
    };

    await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(emailPayload)
    });
  } catch (emailErr) {
    console.error('Failed to trigger subscription email:', emailErr);
  }

  return { success: true }
}

export async function validateSubscriptionAction(pageId: string) {
  const supabase = await createClient()
  console.log(`🔍 Validating subscription for page: ${pageId}`)
  
  const { data: subscription, error } = await (supabase as AppSupabaseClient)
    .from('subscriptions')
    .select('status, ends_at, plan_type')
    .eq('host_page_id', pageId)
    .eq('status', 'active')
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`❌ Subscription validation error for ${pageId}:`, error)
    return { error: error.message }
  }

  if (!subscription) {
    console.warn(`⚠️ No active subscription found for page: ${pageId}`)
    return { active: false }
  }

  console.log(`✅ Active subscription found for ${pageId}: ${subscription.plan_type} (ends: ${subscription.ends_at})`)
  return { active: true, subscription }
}

export async function createSubscriptionOrderAction(planId: 'monthly' | 'yearly', pageId?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // In a real production app, these plan IDs should be in env or DB
    // For now, we use these naming conventions or placeholders
    const PLAN_IDS = {
      monthly: 'plan_SRXmWuHPCvpRxn',
      yearly: 'plan_SRXp4OUDcBfxNV'
    }

    const subscription = await createRazorpaySubscription({
      plan_id: PLAN_IDS[planId],
      total_count: planId === 'monthly' ? 120 : 10, // 10 years max
      customer_notify: true,
      notes: {
        host_page_id: pageId || '',
        user_id: user.id,
        plan_type: planId
      }
    })

    return {
      success: true,
      subscriptionId: subscription.id,
      amount: planId === 'monthly' ? 4900 : 49900, // solely for UI display if needed
      keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    }
  } catch (error: unknown) {
    console.error('createSubscriptionOrderAction error:', error)
    return { error: error instanceof Error ? error.message : 'Failed to initiate recurring subscription' }
  }
}
