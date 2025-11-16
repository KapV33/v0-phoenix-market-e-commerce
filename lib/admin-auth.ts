// Admin authentication utilities for Phoenix Market
import { createAdminClient } from "@/lib/supabase/admin"
import bcrypt from "bcryptjs"

export interface AdminCredentials {
  username: string
  password: string
}

export interface AdminAuthResult {
  success: boolean
  adminId?: string
  error?: string
}

// Login admin
export async function loginAdmin(credentials: AdminCredentials): Promise<AdminAuthResult> {
  try {
    const supabase = createAdminClient()

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, password_hash")
      .eq("username", credentials.username)
      .maybeSingle()

    if (error || !admin) {
      console.log("[v0] Admin not found or error:", error)
      return { success: false, error: "Invalid credentials" }
    }

    // Verify password
    const passwordValid = await bcrypt.compare(credentials.password, admin.password_hash)
    if (!passwordValid) {
      console.log("[v0] Admin password verification failed")
      return { success: false, error: "Invalid credentials" }
    }

    return { success: true, adminId: admin.id }
  } catch (error) {
    console.error("[v0] Admin login exception:", error)
    return { success: false, error: "Login failed" }
  }
}

// Get admin ID from cookie
export function getAdminIdFromCookie(cookieString: string): string | null {
  const match = cookieString.match(/phoenix_admin_id=([^;]+)/)
  return match ? match[1] : null
}

// Verify admin session
export async function verifyAdminSession(adminId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("admins").select("id").eq("id", adminId).maybeSingle()

    return !error && !!data
  } catch (error) {
    return false
  }
}
