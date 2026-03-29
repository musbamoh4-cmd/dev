import { createClient } from '@supabase/supabase-js'

let cached = null

export const getSupabase = () => {
  if (cached) {
    return cached
  }

  const url = process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

  if (!url || !key) {
    cached = {
      supabase: null,
      error: new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.',
      ),
    }
    return cached
  }

  cached = {
    supabase: createClient(url, key, {
      auth: { persistSession: false },
    }),
    error: null,
  }

  return cached
}
