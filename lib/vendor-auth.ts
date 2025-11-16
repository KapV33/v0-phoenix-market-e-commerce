import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function getVendorAuthClient() {
  const cookieStore = await cookies()
  const userSession = cookieStore.get("phoenix_user_id")

  if (!userSession?.value) {
    return { client: null, userId: null, error: "Not authenticated" }
  }

  // Use service role to bypass RLS since we're using custom auth
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return { client: supabase, userId: userSession.value, error: null }
}

export async function getAdminAuthClient() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get("phoenix_admin_id")

  console.log("[v0] Admin auth client - checking cookie:", adminSession?.value)

  if (!adminSession?.value) {
    return { client: null, adminId: null, error: "Not authenticated" }
  }

  // Use service role to bypass RLS since we're using custom auth
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return { client: supabase, adminId: adminSession.value, error: null }
}
