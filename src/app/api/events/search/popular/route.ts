import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = supabaseAdmin

  // Fetch most common keywords from saved_searches
  // Note: Standard Supabase client doesn't support GROUP BY easily in select()
  // We can use an RPC or just fetch and group in JS if the volume is low, 
  // but for production, a dedicated view or RPC is better.
  // Since I can't easily create an RPC without migration, I'll use a direct SQL query via execute if possible, 
  // but let's assume we can fetch recent ones and count.
  
  const { data, error } = await supabase
    .from('saved_searches')
    .select('keyword')
    .not('keyword', 'is', null)
    .limit(100)

  if (error) {
    return NextResponse.json({ popular: [] })
  }

  // Simple frequency count
  const counts: Record<string, number> = {}
  if (data) {
    for (const item of data) {
      const k = item.keyword?.toLowerCase() || ''
      if (k) counts[k] = (counts[k] || 0) + 1
    }
  }

  const popular = Object.entries(counts as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword]) => keyword)

  // Default popular searches if none found
  const defaults = ['Board Games', 'Workshop', 'Networking', 'Concert', 'Yoga']
  const results = popular.length > 0 ? popular : defaults

  return NextResponse.json({ popular: results })
}
