import { z } from 'zod'

export const createHostPageSchema = z.object({
  host_type: z.enum(['individual', 'organisation'], {
    message: 'Please select a host type',
  }),
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(255, 'Display name cannot exceed 255 characters'),
  tagline: z
    .string()
    .max(300, 'Tagline cannot exceed 300 characters')
    .optional()
    .or(z.literal('')),
  description: z.string().optional(),
  website_url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  instagram_handle: z
    .string()
    .optional()
    .or(z.literal('')),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  country: z.string().min(1, 'Country is required').optional(),
})

export type CreateHostProfileInput = z.infer<typeof createHostPageSchema>
