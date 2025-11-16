import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"

export async function POST(request: NextRequest) {
  try {
    const { client, userId, error } = await getVendorAuthClient()

    if (error || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: vendor } = await client.from("vendors").select("id").eq("user_id", userId).single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 403 })
    }

    const { amount, cryptoAddress } = await request.json()

    const { data: wallet } = await client.from("wallets").select("balance").eq("user_id", userId).single()

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    const { error: withdrawalError } = await client.from("withdrawals").insert({
      vendor_id: vendor.id,
      amount,
      crypto_address: cryptoAddress,
      status: "pending",
    })

    if (withdrawalError) throw withdrawalError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to request withdrawal:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
