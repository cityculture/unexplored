import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyFirebaseToken } from '@/lib/firebase/verify-token'
import { createRazorpaySubscription } from '@/lib/razorpay/createSubscription'
import { env } from '@/lib/env_server'
import { v5 as uuidv5 } from 'uuid'

const FIREBASE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

// POST: Create subscription order or record confirmed subscription
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    let decodedToken: any
    try {
      decodedToken = await verifyFirebaseToken(idToken)
    } catch (tokenErr: any) {
      return NextResponse.json({ error: `Unauthorized: ${tokenErr?.message || 'Invalid token'}` }, { status: 401 })
    }

    const userId = uuidv5(decodedToken.uid, FIREBASE_NAMESPACE)
    const body = await request.json()
    const { action } = body

    // Action 1: Create recurring Razorpay subscription order
    if (action === 'create_order') {
      const { planId, pageId } = body
      if (!planId || (planId !== 'monthly' && planId !== 'yearly')) {
        return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
      }

      const PLAN_IDS: Record<string, string> = {
        monthly: process.env.RAZORPAY_PLAN_MONTHLY || 'plan_SRXmWuHPCvpRxn',
        yearly: process.env.RAZORPAY_PLAN_YEARLY || 'plan_SRXp4OUDcBfxNV',
      }

      const subscription = await createRazorpaySubscription({
        plan_id: PLAN_IDS[planId],
        total_count: planId === 'monthly' ? 120 : 10,
        customer_notify: true,
        notes: {
          host_id: pageId || '',
          user_id: userId,
          plan_type: planId,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          amount: planId === 'monthly' ? 4900 : 49900,
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        },
      })
    }

    // Action 2: Record confirmed subscription in database
    if (action === 'confirm') {
      const { pageId, planType, paymentIdOrSubId, isRecurring } = body

      if (!paymentIdOrSubId) {
        return NextResponse.json({ error: 'Missing payment/subscription ID' }, { status: 400 })
      }

      const amount = planType === 'monthly' ? 49 : 499
      const durationDays = planType === 'monthly' ? 30 : 365

      const startsAt = new Date()
      const endsAt = new Date()
      endsAt.setDate(startsAt.getDate() + durationDays)

      // Idempotency check
      if (isRecurring) {
        const { data: existingSub } = await (supabaseAdmin as any)
          .from('subscriptions')
          .select('id')
          .eq('razorpay_subscription_id', paymentIdOrSubId)
          .maybeSingle()
        if (existingSub) return NextResponse.json({ success: true })
      } else {
        const { data: existingPay } = await (supabaseAdmin as any)
          .from('subscriptions')
          .select('id')
          .eq('razorpay_payment_id', paymentIdOrSubId)
          .maybeSingle()
        if (existingPay) return NextResponse.json({ success: true })
      }

      const { data: newSub, error: subError } = await (supabaseAdmin as any)
        .from('subscriptions')
        .insert({
          user_id: userId,
          host_id: pageId,
          plan_type: planType,
          amount: amount,
          currency: 'INR',
          status: 'active',
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          razorpay_payment_id: isRecurring ? null : paymentIdOrSubId,
          razorpay_subscription_id: isRecurring ? paymentIdOrSubId : null,
        })
        .select()
        .single()

      if (subError) {
        console.error('Subscription insert error:', subError)
        return NextResponse.json({ error: subError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: newSub })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('POST /api/subscriptions error:', err)
    return NextResponse.json({ error: err.message || 'Subscription processing failed' }, { status: 500 })
  }
}
