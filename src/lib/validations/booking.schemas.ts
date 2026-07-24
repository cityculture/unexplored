import { z } from 'zod'

// Loose UUID regex to allow both standard and custom mock IDs (e.g. 11111111-...)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const bookingItemSchema = z.object({
  ticket_tier_id: z.string().regex(uuidRegex, 'Invalid ticket tier'),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(5, 'Maximum 5 tickets per tier'),
})

export const createBookingSchema = z
  .object({
    event_id: z.string().regex(uuidRegex, 'Invalid event'),
    items: z
      .array(bookingItemSchema)
      .min(1, 'You must select at least one ticket'),
    attendee_name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name cannot exceed 255 characters'),
    attendee_email: z.string().email('Please enter a valid email address'),
    attendee_phone: z
      .string()
      .min(10, 'Please enter a valid phone number'),
    promo_code: z
      .string()
      .max(50, 'Promo code cannot exceed 50 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      const totalQuantity = data.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      return totalQuantity <= 5
    },
    {
      message: 'Total quantity across all ticket tiers cannot exceed 5 per booking',
      path: ['items'],
    }
  )

export type CreateBookingInput = z.infer<typeof createBookingSchema>
