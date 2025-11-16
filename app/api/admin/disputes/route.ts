import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: disputes, error } = await supabase
      .from("disputes")
      .select(`
        *,
        orders(product_name, product_price, id),
        users(username)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ disputes })
  } catch (error: any) {
    console.error("Failed to fetch disputes:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
