import { z } from 'zod'

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(255, 'Title cannot exceed 255 characters'),
    host_page_id: z.string().uuid('Invalid host page selected'),
    category_id: z.string().uuid('Invalid category selected'),
    start_datetime: z.string().datetime({ message: 'Invalid start date' }),
    end_datetime: z.string().datetime({ message: 'Invalid end date' }),
    timezone: z.string().min(1, 'Timezone is required'),
    ticketing_mode: z.enum(['platform', 'external', 'free', 'rsvp', 'none']),
    event_type: z.enum(['in_person', 'online', 'hybrid']),
    cover_image_url: z.string().url('Cover image is required'),
    vertical_poster_url: z.string().url('Vertical poster (4:5) is required'),
    description: z.string().optional(),
    short_description: z
      .string()
      .max(500, 'Short description must be 500 characters or less')
      .optional(),
    location_id: z.string().uuid().optional(), // assuming if location selected from table
    location: z.object({
      venue_name: z.string().optional(),
      address_line_1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postal_code: z.string().optional(),
    }).optional(),
    online_event_url: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal('')),
    online_platform: z.string().optional(),
    online_url_reveal: z.string().optional(),
    external_ticket_url: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal('')),
    max_capacity: z
      .number()
      .int('Capacity must be a whole number')
      .positive('Capacity must be positive')
      .optional()
      .nullable(),
    is_age_restricted: z.boolean().optional().default(false),
    min_age: z
      .number()
      .int()
      .positive('Age must be a positive number')
      .optional()
      .nullable(),
    doors_open_at: z.string().optional(),
    refund_policy: z.enum(['no_refund', 'flexible', 'moderate', 'strict', 'custom']).optional().default('no_refund'),
    refund_policy_text: z.string().optional(),
    is_recurring: z.boolean().optional().default(false),
    recurrence_rule: z.string().optional(),
    status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional().default('published'),
    ticket_tiers: z.array(
      z.object({
        name: z.string(),
        tier_type: z.string(),
        price: z.number().min(0),
        total_quantity: z.number().int().positive(),
        max_per_booking: z.number().int().positive(),
        tier_category: z.enum(['general', 'boys', 'girls', 'stag', 'couple', 'vip']).optional().default('general'),
        sale_start_at: z.string().optional(),
        sale_end_at: z.string().optional(),
      })
    ).optional(),
    agenda: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        start_time: z.string(),
        end_time: z.string().optional(),
      })
    ).optional(),
    faqs: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ).optional(),
    tags: z.array(z.string()).optional()
  })
  .refine(
    (data) => new Date(data.end_datetime) > new Date(data.start_datetime),
    {
      message: 'End date must be after start date',
      path: ['end_datetime'],
    }
  )
  .refine(
    (data) => {
      if (['online', 'hybrid'].includes(data.event_type)) {
        return true
      }
      return true
    },
    {
      message: 'Online event link is highly recommended for online events',
      path: ['online_event_url'],
    }
  )
  .refine(
    (data) => {
      if (data.ticketing_mode === 'external') {
        return !!data.external_ticket_url
      }
      return true
    },
    {
      message: 'External ticket URL is required for external ticketing mode',
      path: ['external_ticket_url'],
    }
  )

// Make all fields optional for the update schema, but keep refining logic
// Since createEventSchema uses .refine(), we grab its inner schema safely
const _baseEventSchema = z.object({
  title: z.string().min(5).max(255),
  host_page_id: z.string().uuid(),
  category_id: z.string().uuid(),
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
  timezone: z.string().min(1),
  ticketing_mode: z.enum(['platform', 'external', 'free', 'rsvp', 'none']),
  event_type: z.enum(['in_person', 'online', 'hybrid']),
  cover_image_url: z.string().url(),
  vertical_poster_url: z.string().url(),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  location_id: z.string().uuid().optional(),
  location: z.object({
    venue_name: z.string().optional(),
    address_line_1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional(),
  }).optional(),
  online_event_url: z.string().url().optional().or(z.literal('')),
  online_platform: z.string().optional(),
  online_url_reveal: z.string().optional(),
  external_ticket_url: z.string().url().optional().or(z.literal('')),
  max_capacity: z.number().int().positive().optional().nullable(),
    is_age_restricted: z.boolean().optional().default(false),
    min_age: z.number().int().positive().optional().nullable(),
    doors_open_at: z.string().optional(),
    refund_policy: z.enum(['no_refund', 'flexible', 'moderate', 'strict', 'custom']).optional().default('no_refund'),
    refund_policy_text: z.string().optional(),
  is_recurring: z.boolean().optional().default(false),
  recurrence_rule: z.string().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional().default('published'),
  ticket_tiers: z.array(
    z.object({
      name: z.string(),
      tier_type: z.string(),
      price: z.number().min(0),
      total_quantity: z.number().int().positive(),
      max_per_booking: z.number().int().positive(),
      tier_category: z.enum(['general', 'boys', 'girls', 'stag', 'couple', 'vip']).optional().default('general'),
      sale_start_at: z.string().optional(),
      sale_end_at: z.string().optional(),
    })
  ).optional(),
  agenda: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      start_time: z.string(),
      end_time: z.string().optional(),
    })
  ).optional(),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).optional(),
  tags: z.array(z.string()).optional()
})

export const updateEventSchema = _baseEventSchema.partial().refine(
  (data) => {
    // Only check date order if both are provided during the update
    if (data.start_datetime && data.end_datetime) {
      return new Date(data.end_datetime) > new Date(data.start_datetime)
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['end_datetime'],
  }
)

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
