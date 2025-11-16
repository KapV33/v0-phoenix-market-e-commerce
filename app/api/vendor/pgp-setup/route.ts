import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] PGP setup API called")

    const { pgpPublicKey } = await request.json()

    const { client: supabase, userId, error } = await getVendorAuthClient()

    if (error || !supabase || !userId) {
      return NextResponse.json({ error: error || "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", userId)

    // Validate PGP key format
    if (!pgpPublicKey.includes("BEGIN PGP PUBLIC KEY BLOCK") || !pgpPublicKey.includes("END PGP PUBLIC KEY BLOCK")) {
      return NextResponse.json({ error: "Invalid PGP public key format" }, { status: 400 })
    }

    // Check if user already has PGP registered
    const { data: existing } = await supabase
      .from("vendors")
      .select("id, pgp_public_key, status")
      .eq("user_id", userId)
      .maybeSingle()

    console.log("[v0] Existing vendor record:", existing)

    if (existing) {
      // Update existing PGP key
      const { error: updateError } = await supabase
        .from("vendors")
        .update({ pgp_public_key: pgpPublicKey })
        .eq("user_id", userId)

      if (updateError) {
        console.error("[v0] Update error:", updateError)
        throw updateError
      }

      console.log("[v0] PGP key updated successfully")
    } else {
      const { error: insertError } = await supabase.from("vendors").insert({
        user_id: userId,
        pgp_public_key: pgpPublicKey,
        business_name: "",
        status: "pending",
      })

      if (insertError) {
        console.error("[v0] Insert error:", insertError)
        throw insertError
      }

      console.log("[v0] PGP key registered successfully")
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] PGP setup error:", error)
    return NextResponse.json({ error: error.message || "Failed to register PGP key" }, { status: 500 })
  }
}
