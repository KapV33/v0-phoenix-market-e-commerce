import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        messages(created_at)
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ conversations })
  } catch (error: any) {
    console.error("Failed to fetch conversations:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
