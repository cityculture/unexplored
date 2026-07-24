'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export interface CreatePromoInput {
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  event_id?: string | null
  max_uses?: number | null
  uses_per_user?: number
  valid_from?: string | null
  valid_until?: string | null
  min_order_amount?: number
}

export async function createPromoCodeAction(input: CreatePromoInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Validate ownership if event_id is provided
    if (input.event_id) {
      const { data: event } = await (supabase as AppSupabaseClient)
        .from('events')
        .select('host_id')
        .eq('id', input.event_id)
        .single()
      
      if (!event || event.host_id !== user.id) {
        return { error: 'Unauthorized: Not the host of this event' }
      }
    }

    // Ensure code is somewhat unique for this host
    const { data: existingCode } = await (supabase as AppSupabaseClient)
      .from('promo_codes')
      .select('id')
      .eq('host_id', user.id)
      .ilike('code', input.code)
      .eq('is_active', true)
      .maybeSingle()

    if (existingCode) {
      return { error: 'An active promo code with this name already exists.' }
    }

    const { data: promo, error: insertError } = await (supabase as AppSupabaseClient)
      .from('promo_codes')
      .insert({
        host_id: user.id,
        event_id: input.event_id || null,
        code: input.code.toUpperCase(),
        description: input.description || null,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        max_uses: input.max_uses || null,
        uses_per_user: input.uses_per_user || 1,
        valid_from: input.valid_from ? new Date(input.valid_from).toISOString() : null,
        valid_until: input.valid_until ? new Date(input.valid_until).toISOString() : null,
        min_order_amount: input.min_order_amount || 0,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      return { error: 'Failed to create promo code: ' + insertError.message }
    }

    return { success: true, promo }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unexpected error' }
  }
}

export async function togglePromoCodeAction(id: string, isActive: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Verify ownership
    const { data: promo } = await (supabase as AppSupabaseClient)
      .from('promo_codes')
      .select('host_id')
      .eq('id', id)
      .single()

    if (promo?.host_id !== user.id) {
      return { error: 'Unauthorized' }
    }

    const { error: updateError } = await (supabase as AppSupabaseClient)
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', id)

    if (updateError) return { error: updateError.message }

    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unexpected error' }
  }
}

export async function validatePromoCodeAction(code: string, eventId: string, subtotal: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()
    // User can be null if anonymous checkout is supported, but our table needs user_id for uses limit check.
    // If user is not logged in, we reject code if it requires tracking.
    // Assuming mostly logged in users book.

    const { data: promo, error: promoError } = await (supabase as AppSupabaseClient)
      .from('promo_codes')
      .select('*')
      .ilike('code', code)
      .eq('is_active', true)
      .or(`event_id.eq.${eventId},event_id.is.null`)
      .maybeSingle()

    if (promoError || !promo) {
      return { valid: false, reason: 'Invalid or inactive promo code.' }
    }

    // Check dates
    const now = new Date()
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return { valid: false, reason: 'Promo code is not active yet.' }
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return { valid: false, reason: 'Promo code has expired.' }
    }

    // Check min order amount
    if (promo.min_order_amount && subtotal < Number(promo.min_order_amount)) {
      return { valid: false, reason: `Minimum order amount is ₹${promo.min_order_amount}` }
    }

    // Check max uses
    const usedCount = promo.used_count || 0
    if (promo.max_uses !== null && usedCount >= promo.max_uses) {
      return { valid: false, reason: 'Promo code limit reached.' }
    }

    // Check per user limit
    if (user && promo.uses_per_user !== null) {
      const { count } = await (supabase as AppSupabaseClient)
        .from('promo_code_uses')
        .select('*', { count: 'exact', head: true })
        .eq('promo_code_id', promo.id)
        .eq('user_id', user.id)

      if (count !== null && count >= promo.uses_per_user) {
        return { valid: false, reason: 'You have exhausted your uses for this code.' }
      }
    } else if (!user) {
      return { valid: false, reason: 'You must be logged in to use this promo code.' }
    }

    // Calculate discount
    let discountAmount = 0
    if (promo.discount_type === 'percentage') {
      discountAmount = subtotal * (Number(promo.discount_value) / 100)
    } else {
      discountAmount = Number(promo.discount_value)
    }

    // Cap discount to subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal
    }

    return { 
      valid: true, 
      discountAmount: Number(discountAmount.toFixed(2)), 
      promoCodeId: promo.id 
    }
  } catch {
    return { valid: false, reason: 'An error occurred validating the code.' }
  }
}
