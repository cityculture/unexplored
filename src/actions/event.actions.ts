'use server'

import { createClient } from '@/lib/supabase/server'
import { createEventSchema, updateEventSchema } from '@/lib/validations/event.schemas'
import { revalidatePath } from 'next/cache'
import { mapPostgresError } from '@/lib/utils/error-mapper'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export async function createEventAction(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  try {
    const rawData = formData.get('data') as string
    if (!rawData) return { error: 'No data provided' }
    const validated = createEventSchema.parse(JSON.parse(rawData))

    // 0. Verify Subscription before allowing event creation
    const { validateSubscriptionAction } = await import('./subscription.actions')
    const subStatus = await validateSubscriptionAction(validated.host_page_id)
    if (!subStatus.active) {
      return { error: 'Your subscription for this host page is inactive. Please subscribe/renew to create events.' }
    }

    // 1. Create Location if provided
    let locationId: string | null = null
    if (validated.location) {
      const { data: loc, error: locError } = await (supabase as AppSupabaseClient)
        .from('locations')
        .insert({
          venue_name: validated.location.venue_name || null,
          address_line1: validated.location.address_line_1 || null,
          city: validated.location.city || '',
          state: validated.location.state || null,
          country: validated.location.country || '',
          postal_code: validated.location.postal_code || null
        })
        .select('id')
        .single()
      
      if (locError) throw locError
      locationId = loc.id
    }

    // 2. Insert Event
    const { data: createdEvent, error: eventError } = await (supabase as AppSupabaseClient)
      .from('events')
      .insert({
        title: validated.title,
        host_id: user.id,
        host_page_id: validated.host_page_id,
        category_id: validated.category_id,
        location_id: locationId,
        event_type: validated.event_type,
        status: validated.status as Database['public']['Tables']['events']['Insert']['status'],
        start_datetime: validated.start_datetime,
        end_datetime: validated.end_datetime,
        timezone: validated.timezone,
        short_description: validated.short_description,
        description: validated.description,
        cover_image_url: validated.cover_image_url || null,
        vertical_poster_url: validated.vertical_poster_url || null,
        is_age_restricted: validated.is_age_restricted,
        min_age: validated.min_age,
        doors_open_at: validated.doors_open_at || null,
        refund_policy: validated.refund_policy as Database['public']['Tables']['events']['Insert']['refund_policy'],
        refund_policy_text: validated.refund_policy_text,
        ticketing_mode: validated.ticketing_mode as Database['public']['Tables']['events']['Insert']['ticketing_mode'],
        slug: validated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7)
      } as any)
      .select('id, slug')
      .single()

    if (eventError) throw eventError

    // 3. Insert Ticket Tiers
    if (validated.ticket_tiers && validated.ticket_tiers.length > 0) {
      const { error: tierError } = await (supabase as AppSupabaseClient)
        .from('ticket_tiers')
        .insert(
          validated.ticket_tiers.map(t => ({
            event_id: createdEvent.id,
            name: t.name,
            tier_type: t.tier_type,
            tier_category: t.tier_category as Database['public']['Tables']['ticket_tiers']['Insert']['tier_category'],
            price: t.price,
            total_quantity: t.total_quantity,
            max_per_booking: t.max_per_booking
          }))
        )
      
      if (tierError) throw tierError
    }

    // 4. Insert Agenda
    if (validated.agenda && validated.agenda.length > 0) {
      const { error: agendaError } = await (supabase as AppSupabaseClient)
        .from('event_agenda')
        .insert(
          validated.agenda.map((item, idx) => ({
            event_id: createdEvent.id,
            title: item.title,
            description: item.description || null,
            starts_at: item.start_time,
            ends_at: item.end_time || null,
            sort_order: idx
          }))
        )
      if (agendaError) throw agendaError
    }

    // 5. Insert FAQs
    if (validated.faqs && validated.faqs.length > 0) {
      const { error: faqError } = await (supabase as AppSupabaseClient)
        .from('event_faqs')
        .insert(
          validated.faqs.map((item, idx) => ({
            event_id: createdEvent.id,
            question: item.question,
            answer: item.answer,
            sort_order: idx
          }))
        )
      if (faqError) throw faqError
    }

    // 6. Insert Tags
    if (validated.tags && validated.tags.length > 0) {
      for (const tagName of validated.tags) {
        const slug = tagName.toLowerCase().replace(/ /g, '-')
        const { data: tag } = await (supabase as AppSupabaseClient)
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .maybeSingle()
        
        let tagId = tag?.id
        
        if (!tagId) {
          const { data: newTag, error: createError } = await (supabase as AppSupabaseClient)
            .from('tags')
            .insert({ name: tagName, slug })
            .select('id')
            .single()
          
          if (createError) throw createError
          tagId = newTag.id
        }

        const { error: linkError } = await (supabase as AppSupabaseClient)
          .from('event_tags')
          .insert({
            event_id: createdEvent.id,
            tag_id: tagId
          })
        if (linkError) throw linkError
      }
    }

    revalidatePath('/members/host-dashboard')
    return { success: true, slug: createdEvent.slug, id: createdEvent.id }

  } catch (error: unknown) {
    console.error('createEventAction error:', error)
    return { error: mapPostgresError(error) }
  }
}

export async function updateEventAction(eventId: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  try {
    const rawData = formData.get('data') as string
    if (!rawData) return { error: 'No data provided' }
    
    const validated = updateEventSchema.parse(JSON.parse(rawData))

    // Ownership check via host_pages
    const { data: eventData } = await (supabase as AppSupabaseClient)
      .from('events')
      .select('host_page_id, title, slug')
      .eq('id', eventId)
      .single()
    
    if (!eventData) return { error: 'Event not found' }
    
    const { data: pageData } = await (supabase as AppSupabaseClient)
      .from('host_pages')
      .select('user_id')
      .eq('id', eventData.host_page_id || '')
      .single()
    
    if (!pageData || pageData.user_id !== user.id) return { error: 'Unauthorized' }

    // 1. Update Core Event
    const { error: updateError } = await (supabase as AppSupabaseClient)
      .from('events')
      .update({
        title: validated.title,
        category_id: validated.category_id,
        event_type: validated.event_type,
        start_datetime: validated.start_datetime,
        end_datetime: validated.end_datetime,
        short_description: validated.short_description,
        description: validated.description,
        cover_image_url: validated.cover_image_url || undefined,
        vertical_poster_url: validated.vertical_poster_url || undefined,
        is_age_restricted: validated.is_age_restricted,
        min_age: validated.min_age,
        doors_open_at: validated.doors_open_at || undefined,
        status: validated.status as Database['public']['Tables']['events']['Update']['status'],
        refund_policy: validated.refund_policy as Database['public']['Tables']['events']['Update']['refund_policy'],
        refund_policy_text: validated.refund_policy_text
      })
      .eq('id', eventId)

    if (updateError) throw updateError

    // Refetch to see the ACTUAL slug (handles DB triggers if any)
    const { data: finalEvent } = await (supabase as AppSupabaseClient)
      .from('events')
      .select('slug')
      .eq('id', eventId)
      .single()
    
    const actualSlug = finalEvent?.slug || eventData.slug || ''
    console.log('UpdateEventAction: OldSlug=', eventData.slug, 'ActualSlug=', actualSlug)

    // 2. Update Agenda (Delete and Re-insert for simplicity)
    if (validated.agenda) {
      await (supabase as AppSupabaseClient).from('event_agenda').delete().eq('event_id', eventId)
      if (validated.agenda.length > 0) {
        const { error: agendaError } = await (supabase as AppSupabaseClient)
          .from('event_agenda')
          .insert(
            validated.agenda.map((item, idx) => ({
              event_id: eventId,
              title: item.title,
              description: item.description,
              starts_at: item.start_time,
              ends_at: item.end_time,
              sort_order: idx
            }))
          )
        if (agendaError) throw agendaError
      }
    }

    // 3. Update FAQs
    if (validated.faqs) {
      await (supabase as AppSupabaseClient).from('event_faqs').delete().eq('event_id', eventId)
      if (validated.faqs.length > 0) {
        const { error: faqError } = await (supabase as AppSupabaseClient)
          .from('event_faqs')
          .insert(
            validated.faqs.map((item, idx) => ({
              event_id: eventId,
              question: item.question,
              answer: item.answer,
              sort_order: idx
            }))
          )
        if (faqError) throw faqError
      }
    }

    // 4. Update Tags
    if (validated.tags) {
      await (supabase as AppSupabaseClient).from('event_tags').delete().eq('event_id', eventId)
      for (const tagName of validated.tags) {
        const slug = tagName.toLowerCase().replace(/ /g, '-')
        const { data: tag } = await (supabase as AppSupabaseClient)
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .maybeSingle()
        
        let tagId = tag?.id
        
        if (!tagId) {
          const { data: newTag, error: createError } = await (supabase as AppSupabaseClient)
            .from('tags')
            .insert({ name: tagName, slug })
            .select('id')
            .single()
          
          if (createError) throw createError
          tagId = newTag.id
        }

        await (supabase as AppSupabaseClient).from('event_tags').insert({ event_id: eventId, tag_id: tagId })
      }
    }

    // 5. Update Ticket Tiers
    if (validated.ticket_tiers) {
      // For a fresh start, we sync by deleting and re-inserting. 
      await (supabase as AppSupabaseClient).from('ticket_tiers').delete().eq('event_id', eventId)
      if (validated.ticket_tiers.length > 0) {
        const { error: tierError } = await (supabase as AppSupabaseClient)
          .from('ticket_tiers')
          .insert(
            validated.ticket_tiers.map(t => ({
              event_id: eventId,
              name: t.name,
              tier_type: t.tier_type as 'paid' | 'free',
              tier_category: t.tier_category,
              price: t.price,
              total_quantity: t.total_quantity,
              max_per_booking: t.max_per_booking
            }))
          )
        if (tierError) throw tierError
      }
    }

    revalidatePath('/')
    revalidatePath('/events')
    revalidatePath(`/events/${eventData.slug}`)
    if (actualSlug !== eventData.slug) {
      revalidatePath(`/events/${actualSlug}`)
    }
    revalidatePath(`/members/host-dashboard/${eventData.host_page_id}/events`)
    
    return { success: true, slug: actualSlug }
  } catch (error: unknown) {
    console.error('updateEventAction error:', error)
    return { error: mapPostgresError(error) }
  }
}

import { uploadToCloudinary } from '@/lib/cloudinary'

export async function uploadEventImageAction(eventId: string, file: File) {
  const supabase = await createClient()
  
  const { data: { user } } = await (supabase as AppSupabaseClient).auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Ownership check
  if (eventId !== 'new-event' && !eventId.startsWith('temp-')) {
    const { data: event } = await (supabase as AppSupabaseClient).from('events').select('host_id').eq('id', eventId).single()
    if (!event || event.host_id !== user.id) return { error: 'Unauthorized' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Cloudinary
    const folder = eventId === 'new-event' ? 'event-posters/pending' : `event-posters/${eventId}`
    const result = await uploadToCloudinary(buffer, folder)
    
    const publicUrl = result.secure_url

    // Add to event_images table (optional but good for tracking)
    const { data: imageData, error: insertError } = await (supabase as AppSupabaseClient)
      .from('event_images')
      .insert({
        event_id: (eventId === 'new-event' || eventId.startsWith('temp-')) ? (null as unknown as string) : eventId,
        image_url: publicUrl,
        is_cover: false
      })
      .select()
      .single()

    if (insertError) {
      // If eventId exists, try updating cover_image_url as fallback
      if (eventId !== 'new-event' && !eventId.startsWith('temp-')) {
        const { data: currentEvent } = await (supabase as AppSupabaseClient).from('events').select('cover_image_url').eq('id', eventId).single()
        if (currentEvent && !currentEvent.cover_image_url) {
          await (supabase as AppSupabaseClient).from('events').update({ cover_image_url: publicUrl }).eq('id', eventId)
        }
      }
      return { success: true, url: publicUrl }
    }

    return { success: true, image: imageData, url: publicUrl }
  } catch (error: unknown) {
    console.error('uploadEventImageAction error:', error)
    return { error: error instanceof Error ? error.message : 'Failed to upload image' }
  }
}

export async function updateEventStatusAction(eventId: string, status: string) {
  const supabase = await createClient()
  const { error } = await (supabase as AppSupabaseClient)
    .from('events')
    .update({ status: status as Database['public']['Tables']['events']['Update']['status'] })
    .eq('id', eventId)
  if (error) return { error: error.message }
  revalidatePath('/members/host-dashboard')
  return { success: true }
}

export async function deleteEventAction(eventId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await (supabase as AppSupabaseClient).auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Ownership check
  const { data: event, error: fetchError } = await (supabase as AppSupabaseClient)
    .from('events')
    .select('host_id, status')
    .eq('id', eventId)
    .single()

  if (fetchError || !event || event.host_id !== user.id) {
    return { error: 'Unauthorized or event not found' }
  }

  try {
    // 1. Check for bookings
    const { count, error: countError } = await (supabase as AppSupabaseClient)
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)

    if (countError) throw countError

    if (count && count > 0) {
      // Soft delete: set status to 'cancelled' so bookings remains valid
      const { error: cancelError } = await (supabase as AppSupabaseClient)
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId)
      
      if (cancelError) throw cancelError
      revalidatePath('/members/host-dashboard')
      return { success: true, message: 'Event has bookings, so it was marked as Cancelled instead of deleted.' }
    }

    // 2. Hard delete (safe because no bookings exist)
    const { error: deleteError } = await (supabase as AppSupabaseClient)
      .from('events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      // If still fails due to unknown constraints, fallback to cancelled
      await (supabase as AppSupabaseClient).from('events').update({ status: 'cancelled' }).eq('id', eventId)
      return { success: true, message: 'Event was marked as Cancelled due to database constraints.' }
    }

    revalidatePath('/members/host-dashboard')
    return { success: true }
    
  } catch (error: unknown) {
    console.error('deleteEventAction error:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete event' }
  }
}
