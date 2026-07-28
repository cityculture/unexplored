import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env_server'
import { Database } from '../../types/database.types'

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'

export const supabaseAdmin = createClient<Database>(
  url,
  key,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
