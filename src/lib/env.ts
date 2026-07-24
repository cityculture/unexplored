import { z } from 'zod';

/**
 * PUBLIC ENVIRONMENT VARIABLES ONLY
 * ---------------------------------
 * NEVER add secret keys (API secrets, service roles, etc.) to this file.
 * This file is safe to import in Client Components.
 * For server-side secrets, use @/lib/env_server.ts
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const processEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
};

const parsed = publicEnvSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error('❌ Invalid public environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid public environment variables');
}

export const env = parsed.data;
