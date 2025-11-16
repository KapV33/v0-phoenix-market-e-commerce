import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { category, subject, message } = await request.json()

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        type: "support",
        subject: `[${category}] ${subject}`,
        user_id: userId,
        status: "open",
      })
      .select()
      .single()

    if (convError) throw convError

    // Add initial message
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: userId,
      sender_type: "user",
      message,
    })

    return NextResponse.json({ success: true, conversationId: conversation.id })
  } catch (error: any) {
    console.error("Failed to create support ticket:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
