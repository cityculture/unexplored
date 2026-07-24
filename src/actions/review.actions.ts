'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export async function createReview(formData: FormData) {
  const eventId = formData.get('eventId') as string
  const rating = parseInt(formData.get('rating') as string)
  const title = formData.get('title') as string
  const reviewText = formData.get('reviewText') as string
  const bookingId = formData.get('bookingId') as string | null
  const hostRating = parseInt(formData.get('hostRating') as string) || null
  const venueRating = parseInt(formData.get('venueRating') as string) || null
  const valueRating = parseInt(formData.get('valueRating') as string) || null

  if (!rating || rating < 1 || rating > 5) {
    return { error: 'Invalid rating' }
  }

  const supabase = await createClient()
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to leave a review' }
  }

  const { error } = await (supabase as AppSupabaseClient)
    .from('event_reviews')
    .insert({
      event_id: eventId,
      user_id: user.id,
      booking_id: bookingId || null,
      rating,
      rating_host: hostRating,
      rating_venue: venueRating,
      rating_value: valueRating,
      title: title || null,
      review_text: reviewText || null,
      is_approved: true // Auto-approve for now, or use moderation
    })

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function toggleReviewHelpful(reviewId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()

  if (!user) return { error: 'You must be logged in to vote' }

  // Check if already voted
  const { data: existingVote } = await (supabase as AppSupabaseClient)
    .from('review_helpful_votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('review_id', reviewId)
    .maybeSingle()

  if (existingVote) {
    const { error } = await (supabase as AppSupabaseClient)
      .from('review_helpful_votes')
      .delete()
      .eq('id', existingVote.id)

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    return { success: true, action: 'removed' }
  } else {
    const { error } = await (supabase as AppSupabaseClient)
      .from('review_helpful_votes')
      .insert({
        user_id: user.id,
        review_id: reviewId,
        is_helpful: true
      })

    if (error) return { error: error.message }
    revalidatePath(`/events/${eventId}`)
    return { success: true, action: 'added' }
  }
}
