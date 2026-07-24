import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env_server'
import { Database } from '../../types/database.types'

export const supabaseAdmin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
