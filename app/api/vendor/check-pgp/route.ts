import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, userId, error } = await getVendorAuthClient()

    if (error || !supabase || !userId) {
      return NextResponse.json({ error: error || "Not authenticated" }, { status: 401 })
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("pgp_public_key, status, business_name")
      .eq("user_id", userId)
      .maybeSingle()

    return NextResponse.json({
      hasPGP: !!vendor?.pgp_public_key,
      hasApplied: !!(vendor?.business_name && vendor.business_name.trim() !== ""),
      status: vendor?.status || null,
    })
  } catch (error: any) {
    console.error("[v0] Check PGP error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
