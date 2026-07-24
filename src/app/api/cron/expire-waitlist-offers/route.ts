import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  // Verify Vercel cron authorization header
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch expired offers
    const { data: expiredOffers, error } = await supabaseAdmin
      .from('event_waitlist')
      .select('id, event_id, ticket_tier_id')
      .eq('status', 'offered')
      .lt('offer_expires_at', new Date().toISOString())

    if (error) throw error

    if (!expiredOffers || expiredOffers.length === 0) {
       return NextResponse.json({ processed: 0 })
    }

    const processedCounts: Record<string, number> = {}

    for (const offer of expiredOffers) {
      // 1. Mark as expired
      await supabaseAdmin
        .from('event_waitlist')
        .update({ status: 'expired' as 'waiting' | 'offered' | 'booked' | 'expired' | 'cancelled' })
        .eq('id', offer.id)

      // 2. Track to re-offer
      const key = `${offer.event_id}_${offer.ticket_tier_id}`
      processedCounts[key] = (processedCounts[key] || 0) + 1
    }

    // 3. Re-offer to next people via waitlist process API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
                    
    for (const key of Object.keys(processedCounts)) {
      const [eventId, ticketTierId] = key.split('_')
      const quantity = processedCounts[key]
      
      try {
        await fetch(`${baseUrl}/api/waitlist/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, ticketTierId, quantity })
        })
      } catch (err) {
        console.error('Failed to trigger waitlist process for expired offers', err)
      }
    }

    return NextResponse.json({ processed: expiredOffers.length })
  } catch (err: any) {
    console.error('Expire waitlist offers error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
