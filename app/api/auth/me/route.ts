import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if user is admin
    const { data: admin } = await supabase.from("admins").select("id").eq("id", userId).maybeSingle()

    // Check if user is vendor
    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", userId).maybeSingle()

    return NextResponse.json({
      userId,
      isAdmin: !!admin,
      isVendor: !!vendor,
      vendorId: vendor?.id,
    })
  } catch (error: any) {
    console.error("[v0] Error checking user role:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
