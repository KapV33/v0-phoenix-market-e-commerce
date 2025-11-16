import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: dispute } = await supabase
      .from("disputes")
      .select(`
        *,
        orders(product_name, product_price)
      `)
      .eq("order_id", params.orderId)
      .single()

    return NextResponse.json({ dispute })
  } catch (error: any) {
    console.error("Failed to fetch dispute:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { reason } = await request.json()

    // Get escrow
    const { data: escrow } = await supabase
      .from("escrows")
      .select("id")
      .eq("order_id", params.orderId)
      .eq("buyer_id", user.id)
      .single()

    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 })
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .insert({
        escrow_id: escrow.id,
        order_id: params.orderId,
        opened_by: user.id,
        reason,
        status: "open",
      })
      .select()
      .single()

    if (disputeError) throw disputeError

    // Update escrow status
    await supabase.from("escrows").update({ status: "disputed" }).eq("id", escrow.id)

    // Update order status
    await supabase.from("orders").update({ escrow_status: "disputed" }).eq("id", params.orderId)

    // Create conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .insert({
        type: "dispute",
        subject: `Dispute - Order ${params.orderId.slice(0, 8)}`,
        user_id: user.id,
        dispute_id: dispute.id,
        status: "open",
      })
      .select()
      .single()

    // Add initial message
    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_type: "user",
        message: reason,
      })
    }

    return NextResponse.json({ success: true, disputeId: dispute.id })
  } catch (error: any) {
    console.error("Failed to create dispute:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
