import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: cards, error } = await supabase
      .from("cards")
      .select("id, bin, country, base_seller, name, city, state, zip, fullz, price, vendor_id, is_sold")
      .eq("is_sold", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching cards:", error)
      return NextResponse.json({ cards: [] })
    }

    return NextResponse.json({ cards: cards || [] })
  } catch (error) {
    console.error("[v0] Cards fetch error:", error)
    return NextResponse.json({ cards: [] })
  }
}
