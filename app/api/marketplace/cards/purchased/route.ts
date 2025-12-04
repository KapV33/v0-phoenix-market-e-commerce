import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("phoenix_user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: cards, error } = await supabase
      .from("cards")
      .select("*")
      .eq("buyer_id", userId)
      .eq("is_sold", true)
      .order("purchased_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching purchased cards:", error)
      return NextResponse.json({ cards: [] })
    }

    return NextResponse.json({ cards: cards || [] })
  } catch (error) {
    console.error("[v0] Purchased cards fetch error:", error)
    return NextResponse.json({ cards: [] })
  }
}
