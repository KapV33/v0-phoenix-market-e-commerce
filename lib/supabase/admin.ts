import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key for admin operations
// This bypasses Row Level Security and should only be used for trusted server-side operations
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_NEXT_PHNX_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase URL or Service Role Key. Check your environment variables:\n" +
        "- SUPABASE_URL or SUPABASE_NEXT_PHNX_SUPABASE_URL\n" +
        "- SUPABASE_SERVICE_ROLE_KEY",
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
