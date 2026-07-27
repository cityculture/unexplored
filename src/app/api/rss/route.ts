import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = supabaseAdmin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cityculture.in'

  // Fetch 50 latest published events
  const { data: events, error } = await supabase
    .from('events')
    .select('*, locations(city, venue_name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return new Response('Error fetching events', { status: 500 })
  }

  const feedItems = events?.map((event) => `
    <item>
      <title><![CDATA[${event.title}]]></title>
      <link>${siteUrl}/events/${event.slug}</link>
      <guid>${siteUrl}/events/${event.slug}</guid>
      <description><![CDATA[${event.short_description || (event.description as string | null)?.substring(0, 200) || ''}]]></description>
      <pubDate>${new Date(event.created_at || '').toUTCString()}</pubDate>
      <category>${event.category_id}</category>
    </item>
  `).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>City Culture Events</title>
    <link>${siteUrl}</link>
    <description>Latest cultural events and happenings in your city.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${feedItems}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  })
}
