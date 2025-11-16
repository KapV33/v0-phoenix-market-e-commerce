import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const supabase = await createClient()
    const { userId } = await params

    // Get user info
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) throw userError

    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle()

    const { data: vendor } = await supabase.from("vendors").select("status").eq("user_id", userId).maybeSingle()

    return NextResponse.json({
      id: user.id,
      username: user.username,
      created_at: user.created_at,
      wallet_balance: wallet?.balance || 0,
      is_vendor: !!vendor,
      vendor_status: vendor?.status,
    })
  } catch (error) {
    console.error("[v0] Profile fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
