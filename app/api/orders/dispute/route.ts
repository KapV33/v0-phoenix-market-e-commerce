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
    const { orderId, reason } = await request.json()

    // Get the escrow
    const { data: escrow, error: escrowError } = await supabase
      .from("escrows")
      .select("*, orders!inner(user_id)")
      .eq("order_id", orderId)
      .eq("status", "active")
      .single()

    if (escrowError || !escrow) {
      return NextResponse.json({ error: "Escrow not found or already finalized" }, { status: 404 })
    }

    // Verify the user is the buyer
    if (escrow.orders.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .insert({
        order_id: orderId,
        escrow_id: escrow.id,
        opened_by: userId,
        reason,
        status: "open",
      })
      .select()
      .single()

    if (disputeError) throw disputeError

    // Update escrow status
    await supabase.from("escrows").update({ status: "disputed" }).eq("id", escrow.id)

    // Update order
    await supabase.from("orders").update({ escrow_status: "disputed" }).eq("id", orderId)

    return NextResponse.json({ success: true, disputeId: dispute.id })
  } catch (error: any) {
    console.error("[v0] Error creating dispute:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
