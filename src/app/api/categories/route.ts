import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('API /api/categories Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ categories: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
