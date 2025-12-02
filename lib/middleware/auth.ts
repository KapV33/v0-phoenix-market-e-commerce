import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function requireAuth(request: NextRequest) {
  const userId = request.cookies.get("phoenix_user_id")?.value || request.cookies.get("user_session")?.value

  if (!userId) {
    return { authorized: false, error: "Not authenticated", userId: null }
  }

  try {
    const supabase = await createServerClient()
    const { data: user, error } = await supabase.from("users").select("id").eq("id", userId).single()

    if (error || !user) {
      return { authorized: false, error: "Invalid session", userId: null }
    }

    return { authorized: true, error: null, userId }
  } catch (error) {
    return { authorized: false, error: "Authentication failed", userId: null }
  }
}

export async function requireVendorAuth(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return { ...auth, vendorId: null }
  }

  try {
    const supabase = await createServerClient()
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("id, status")
      .eq("user_id", auth.userId)
      .single()

    if (error || !vendor) {
      return { authorized: false, error: "Not a vendor", userId: auth.userId, vendorId: null }
    }

    if (vendor.status !== "approved") {
      return { authorized: false, error: "Vendor not approved", userId: auth.userId, vendorId: null }
    }

    return { authorized: true, error: null, userId: auth.userId, vendorId: vendor.id }
  } catch (error) {
    return { authorized: false, error: "Vendor auth failed", userId: auth.userId, vendorId: null }
  }
}

export async function requireAdminAuth(request: NextRequest) {
  const adminId = request.cookies.get("phoenix_admin_id")?.value

  if (!adminId) {
    return { authorized: false, error: "Not authenticated", adminId: null }
  }

  try {
    const supabase = await createServerClient()
    const { data: admin, error } = await supabase.from("admins").select("id").eq("id", adminId).single()

    if (error || !admin) {
      return { authorized: false, error: "Invalid admin session", adminId: null }
    }

    return { authorized: true, error: null, adminId }
  } catch (error) {
    return { authorized: false, error: "Admin auth failed", adminId: null }
  }
}
