import { createClient } from '../supabase/server'
import { Category } from '@/types'
import { cache } from 'react'

export const getAllCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select(
      `
      id, name, slug, description, icon_url, color_hex,
      parent_id, is_active, sort_order, created_at
    `
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
})

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select(
      `
      id, name, slug, description, icon_url, color_hex,
      parent_id, is_active, sort_order, created_at
    `
    )
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return data
}
