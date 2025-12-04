import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("phoenix_user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", userId).single()

    if (!vendor) {
      return NextResponse.json({ error: "Not a vendor" }, { status: 403 })
    }

    const { data: cards, error } = await supabase
      .from("cards")
      .select("id, bin, country, price, is_sold, purchased_at")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching vendor cards:", error)
      return NextResponse.json({ cards: [] })
    }

    return NextResponse.json({ cards: cards || [] })
  } catch (error) {
    console.error("[v0] Vendor cards fetch error:", error)
    return NextResponse.json({ cards: [] })
  }
}
