import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Vendor apply API called")

    const { businessName, bio } = await request.json()

    const { client: supabase, userId, error } = await getVendorAuthClient()

    if (error || !supabase || !userId) {
      return NextResponse.json({ error: error || "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", userId)

    // Check if user has PGP key registered
    const { data: existing } = await supabase.from("vendors").select("*").eq("user_id", userId).maybeSingle()

    console.log("[v0] Existing vendor record:", existing)

    if (!existing || !existing.pgp_public_key) {
      return NextResponse.json({ error: "You must register a PGP key before applying" }, { status: 400 })
    }

    if (existing.business_name && existing.business_name.trim() !== "") {
      if (existing.status === "pending") {
        return NextResponse.json({ error: "You already have a pending vendor application" }, { status: 400 })
      }
      if (existing.status === "approved") {
        return NextResponse.json({ error: "You are already an approved vendor" }, { status: 400 })
      }
    }

    // Update vendor record with application details
    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        business_name: businessName,
        bio: bio || null,
        status: "pending",
        applied_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (updateError) {
      console.error("[v0] Update error:", updateError)
      throw updateError
    }

    console.log("[v0] Vendor application submitted successfully")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Vendor application error:", error)
    return NextResponse.json({ error: error.message || "Failed to submit application" }, { status: 500 })
  }
}
