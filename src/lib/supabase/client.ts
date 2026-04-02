import { createBrowserClient } from '@supabase/ssr'

// This function creates a singleton Supabase client for use in browser components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
