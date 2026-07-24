import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import * as handlers from './handlers'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not defined')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // 1. Verify Signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== signature) {
    console.error('Invalid Razorpay webhook signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(rawBody)
  const event = payload.event

  try {
    // 2. Log entry in audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      action: 'webhook.razorpay.received',
      entity_type: 'razorpay_event',
      entity_id: payload.account_id || 'system',
      metadata: { event, payload: { id: payload.id, created_at: payload.created_at } }
    })

    // 3. Route Event
    switch (event) {
      case 'payment.captured':
        await handlers.handlePaymentCaptured(payload.payload)
        break
      case 'payment.failed':
        await handlers.handlePaymentFailed(payload.payload)
        break
      case 'refund.created':
        await handlers.handleRefundCreated(payload.payload)
        break
      case 'refund.processed':
        await handlers.handleRefundProcessed(payload.payload)
        break
      case 'subscription.charged':
        await handlers.handleSubscriptionCharged(payload.payload)
        break
      case 'subscription.cancelled':
        await handlers.handleSubscriptionCancelled(payload.payload)
        break
      case 'subscription.halted':
        await handlers.handleSubscriptionHalted(payload.payload)
        break
      default:
        console.log(`Unhandled Razorpay event: ${event}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error(`Error processing Razorpay webhook (${event}):`, error)
    
    // Log error to audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      action: 'webhook.razorpay.error',
      entity_type: 'razorpay_event',
      entity_id: payload.id || 'system',
      metadata: { event, error: (error as Error).message || 'Unknown error', payload_id: payload.id }
    })

    // ALWAYS return 200 to Razorpay as per requirements
    return NextResponse.json({ received: true, error: 'Internal processing error' }, { status: 200 })
  }
}
