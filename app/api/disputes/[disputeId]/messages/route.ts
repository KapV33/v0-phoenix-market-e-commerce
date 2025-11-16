import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { disputeId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("dispute_id", params.disputeId)
      .single()

    if (!conversation) {
      return NextResponse.json({ messages: [] })
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        *,
        users(username)
      `)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { disputeId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { message } = await request.json()

    // Get conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("dispute_id", params.disputeId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Determine sender type
    const { data: isVendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single()

    const { data: isAdmin } = await supabase.from("admins").select("id").eq("id", user.id).single()

    const senderType = isAdmin ? "admin" : isVendor ? "vendor" : "user"

    // Insert message
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_type: senderType,
      message,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to send message:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
