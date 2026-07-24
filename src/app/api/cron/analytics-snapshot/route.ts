import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  // Calculate yesterday's metrics
  // 1. New Users
  const { count: newUsers } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterdayStr + 'T00:00:00Z')
    .lt('created_at', yesterdayStr + 'T23:59:59Z')

  // 2. New Events
  const { count: newEvents } = await supabaseAdmin
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterdayStr + 'T00:00:00Z')
    .lt('created_at', yesterdayStr + 'T23:59:59Z')

  // 3. Bookings & Revenue
  const { data: bookingStats } = await supabaseAdmin
    .from('bookings')
    .select('platform_fee, total_amount')
    .eq('status', 'confirmed')
    .gte('paid_at', yesterdayStr + 'T00:00:00Z')
    .lt('paid_at', yesterdayStr + 'T23:59:59Z')
  
  const totalBookings = bookingStats?.length || 0
  const totalRevenue = bookingStats?.reduce((acc: number, curr: { total_amount: number | null }) => acc + (curr.total_amount || 0), 0) || 0
  const totalPlatformFee = bookingStats?.reduce((acc: number, curr: { platform_fee: number | null }) => acc + (curr.platform_fee || 0), 0) || 0

  // Insert into analytics_daily
  const { error } = await supabaseAdmin
    .from('analytics_daily')
    .insert({
      snapshot_date: yesterdayStr,
      metric_type: 'platform',
      new_users: newUsers || 0,
      new_events: newEvents || 0,
      total_bookings: totalBookings,
      total_revenue: totalRevenue,
      total_platform_fee: totalPlatformFee,
      page_views: 0
    })

  if (error) {
    console.error('[Cron] Analytics Snapshot failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, date: yesterdayStr })
}
