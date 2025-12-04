import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
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
