import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof window !== 'undefined' ? (window as unknown as { env?: { PUBLIC_SUPABASE_URL?: string } }).env?.PUBLIC_SUPABASE_URL : undefined);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof window !== 'undefined' ? (window as unknown as { env?: { PUBLIC_SUPABASE_ANON_KEY?: string } }).env?.PUBLIC_SUPABASE_ANON_KEY : undefined);
  
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  return { url, anonKey };
}

// Server-side Supabase client
export function createServerClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

// Client-side Supabase client
export function createClientClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey);
}

// Default export for backward compatibility
export async function initSupabase() {
  return createClientClient();
}


