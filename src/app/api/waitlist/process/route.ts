import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, ticketTierId, quantity } = body

    if (!eventId || !ticketTierId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: waitlistUsers, error: fetchError } = await supabaseAdmin
      .from('event_waitlist')
      .select('id, user_id, position')
      .eq('event_id', eventId)
      .eq('ticket_tier_id', ticketTierId)
      .eq('status', 'waiting')
      .order('position', { ascending: true })
      .limit(quantity)

    if (fetchError) throw fetchError

    if (!waitlistUsers || waitlistUsers.length === 0) {
      return NextResponse.json({ offeredCount: 0 })
    }

    const { data: event } = await supabaseAdmin
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single()

    const eventTitle = event?.title || 'an event'

    for (const waitlister of waitlistUsers) {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 4) // 4 hours limit

      await supabaseAdmin
        .from('event_waitlist')
        .update({
          status: 'offered',
          notified_at: new Date().toISOString(),
          offer_expires_at: expiresAt.toISOString()
        })
        .eq('id', waitlister.id)

      await supabaseAdmin.from('notifications').insert({
        user_id: waitlister.user_id,
        type: 'waitlist_offer',
        title: `A ticket is available for ${eventTitle}`,
        body: 'You have 4 hours to book your ticket before the offer expires.',
        related_id: eventId,
        related_type: 'event',
        channel: 'in_app'
      })
    }

    return NextResponse.json({ offeredCount: waitlistUsers.length })
  } catch (error: any) {
    console.error('Waitlist Process Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
