import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", params.conversationId)
      .single()

    if (error || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json({ conversation })
  } catch (error: any) {
    console.error("Failed to fetch conversation:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
