import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("*, users(username)")
      .order("applied_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ vendors })
  } catch (error: any) {
    console.error("Failed to fetch vendors:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
