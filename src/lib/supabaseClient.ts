import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof window !== 'undefined' ? (window as unknown as { env?: { PUBLIC_SUPABASE_URL?: string } }).env?.PUBLIC_SUPABASE_URL : undefined);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof window !== 'undefined' ? (window as unknown as { env?: { PUBLIC_SUPABASE_ANON_KEY?: string } }).env?.PUBLIC_SUPABASE_ANON_KEY : undefined);
  
  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
       console.warn('⚠️ Supabase environment variables are missing (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY).');
    } else {
       console.error('Supabase config missing');
    }
    return { url: '', anonKey: '' };
  }
  
  return { url, anonKey };
}

// Server-side Supabase client
export function createServerClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();
  if (!url) return {} as SupabaseClient;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

// Client-side Supabase client
export function createClientClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();
  if (!url) return {} as SupabaseClient;

  return createClient(url, anonKey);
}

// Admin client (server-only)
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !serviceKey) {
    console.warn('⚠️ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Admin Client.');
    return {} as SupabaseClient;
  }
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Export a convenience singleton instance
export const supabase = createClientClient();

// Default export for backward compatibility
export async function initSupabase() {
  return createClientClient();
}
