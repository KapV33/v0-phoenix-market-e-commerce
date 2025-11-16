import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: tickets, error } = await supabase
      .from("conversations")
      .select(`
        *,
        users(username, email),
        messages(created_at)
      `)
      .eq("type", "support")
      .order("updated_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ tickets })
  } catch (error: any) {
    console.error("Failed to fetch support tickets:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
