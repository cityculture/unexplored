import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = supabaseAdmin

  const { data, error } = await supabase
    .from('v_events_public')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .gte('start_datetime', new Date().toISOString())
    .order('start_datetime', { ascending: true })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: data })
}
