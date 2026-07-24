import { createClient } from '../supabase/server'
import { BookingWithItems } from '@/types/api.types'
import { BookingInsert, Booking } from '@/types'

export async function createBooking(
  bookingData: BookingInsert
): Promise<Booking> {
  const supabase = await createClient()

  // Note: For a real payment flow, creating booking & items might need to be an RPC transaction
  // Assuming basic insertion for now
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select(
      `
      id, booking_ref, user_id, event_id, promo_code_id,
      status, payment_status, subtotal, discount_amount,
      taxable_amount, platform_fee, gst_on_fee, total_amount, host_payout,
      currency, razorpay_order_id, razorpay_payment_id,
      razorpay_signature, razorpay_method, paid_at,
      attendee_name, attendee_email, attendee_phone,
      cancelled_at, cancelled_by, cancellation_reason,
      refund_amount, refunded_at, expires_at,
      invoice_number, invoice_url, notes,
      created_at, updated_at
    `
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getBookingByRef(
  ref: string
): Promise<BookingWithItems | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id, booking_ref, user_id, event_id, promo_code_id,
      status, payment_status, subtotal, discount_amount,
      taxable_amount, platform_fee, gst_on_fee, total_amount, host_payout,
      currency, razorpay_order_id, razorpay_payment_id,
      razorpay_signature, razorpay_method, paid_at,
      attendee_name, attendee_email, attendee_phone,
      cancelled_at, cancelled_by, cancellation_reason,
      refund_amount, refunded_at, expires_at,
      invoice_number, invoice_url, notes,
      created_at, updated_at,
      items:booking_items (
        id, booking_id, ticket_tier_id, quantity, unit_price, subtotal, created_at
      ),
      ticket_tiers:ticket_tiers!booking_items (
        id, event_id, name, description, tier_type, price, currency, total_quantity, sold_count, reserved_count, max_per_booking, min_per_booking, sale_start_at, sale_end_at, perks, is_active, is_visible, sort_order, created_at, updated_at
      )
    `
    )
    .eq('booking_ref', ref)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return data as unknown as BookingWithItems
}

export async function getBookingsByUser(
  userId: string
): Promise<BookingWithItems[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id, booking_ref, user_id, event_id, promo_code_id,
      status, payment_status, subtotal, discount_amount,
      taxable_amount, platform_fee, gst_on_fee, total_amount, host_payout,
      currency, razorpay_order_id, razorpay_payment_id,
      razorpay_signature, razorpay_method, paid_at,
      attendee_name, attendee_email, attendee_phone,
      cancelled_at, cancelled_by, cancellation_reason,
      refund_amount, refunded_at, expires_at,
      invoice_number, invoice_url, notes,
      created_at, updated_at,
      items:booking_items (
        id, booking_id, ticket_tier_id, quantity, unit_price, subtotal, created_at
      ),
      ticket_tiers:ticket_tiers!booking_items (
        id, event_id, name, description, tier_type, price, currency, total_quantity, sold_count, reserved_count, max_per_booking, min_per_booking, sale_start_at, sale_end_at, perks, is_active, is_visible, sort_order, created_at, updated_at
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as BookingWithItems[]
}

export async function updateBookingStatus(
  id: string,
  status: string,
  paymentData?: {
    razorpay_payment_id?: string
    razorpay_signature?: string
    payment_status?: string
    paid_at?: string
  }
): Promise<Booking> {
  const supabase = await createClient()

  const payload: Partial<Booking> = { status: status }
  
  if (paymentData) {
    if (paymentData.razorpay_payment_id) payload.razorpay_payment_id = paymentData.razorpay_payment_id
    if (paymentData.razorpay_signature) payload.razorpay_signature = paymentData.razorpay_signature
    if (paymentData.payment_status) payload.payment_status = paymentData.payment_status
    if (paymentData.paid_at) payload.paid_at = paymentData.paid_at
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', id)
    .select(
      `
      id, booking_ref, user_id, event_id, promo_code_id,
      status, payment_status, subtotal, discount_amount,
      taxable_amount, platform_fee, gst_on_fee, total_amount, host_payout,
      currency, razorpay_order_id, razorpay_payment_id,
      razorpay_signature, razorpay_method, paid_at,
      attendee_name, attendee_email, attendee_phone,
      cancelled_at, cancelled_by, cancellation_reason,
      refund_amount, refunded_at, expires_at,
      invoice_number, invoice_url, notes,
      created_at, updated_at
    `
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
