import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAdminAuthClient } from "@/lib/vendor-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Vendor approval API called")

    const cookieStore = await cookies()
    const adminId = cookieStore.get("phoenix_admin_id")?.value

    console.log("[v0] Admin ID from cookie:", adminId)

    if (!adminId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { vendorId, approved } = await request.json()

    console.log("[v0] Approval request:", { vendorId, approved })

    const { client: supabase, error: authError } = await getAdminAuthClient()

    console.log("[v0] Auth client result:", { hasClient: !!supabase, authError })

    if (authError || !supabase) {
      return NextResponse.json({ error: authError || "Failed to create client" }, { status: 500 })
    }

    const { data: admin, error: adminError } = await supabase.from("admins").select("id").eq("id", adminId).single()

    console.log("[v0] Admin lookup result:", { admin, adminError })

    if (adminError || !admin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { error } = await supabase
      .from("vendors")
      .update({
        status: approved ? "approved" : "rejected",
        approved_at: approved ? new Date().toISOString() : null,
        approved_by: admin.id,
      })
      .eq("id", vendorId)

    if (error) {
      console.error("[v0] Update error:", error)
      throw error
    }

    console.log("[v0] Vendor status updated successfully")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to approve vendor:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
