import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching vendor profile")

    const { client, userId, error } = await getVendorAuthClient()

    if (error || !userId) {
      console.log("[v0] Not authenticated:", error)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] User ID from cookie:", userId)

    const { data: vendor, error: vendorError } = await client.from("vendors").select("*").eq("user_id", userId).single()

    console.log("[v0] Vendor query result:", { vendor: vendor?.id, error: vendorError })

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 403 })
    }

    const { data: wallet } = await client.from("wallets").select("balance").eq("user_id", userId).maybeSingle()

    return NextResponse.json({
      vendor: {
        ...vendor,
        balance: wallet?.balance || 0,
      },
    })
  } catch (error: any) {
    console.error("[v0] Failed to fetch vendor profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { client, userId, error } = await getVendorAuthClient()

    if (error || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { businessName, bio, avatarUrl } = await request.json()

    const { error: updateError } = await client
      .from("vendors")
      .update({
        business_name: businessName,
        bio,
        avatar_url: avatarUrl,
      })
      .eq("user_id", userId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to update vendor profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
