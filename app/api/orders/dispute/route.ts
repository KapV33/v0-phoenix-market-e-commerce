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
    const { escrowId, reason } = await request.json()

    console.log("[v0] Opening dispute for escrow:", escrowId)

    const { data: escrow, error: escrowError } = await supabase
      .from("escrows")
      .select("*, orders!inner(user_id)")
      .eq("id", escrowId)
      .eq("status", "active")
      .single()

    if (escrowError || !escrow) {
      console.error("[v0] Escrow lookup error:", escrowError)
      return NextResponse.json({ error: "Escrow not found or already finalized" }, { status: 404 })
    }

    console.log("[v0] Escrow found:", escrow.id, "Order:", escrow.order_id)

    if (escrow.orders.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .insert({
        order_id: escrow.order_id,
        escrow_id: escrow.id,
        opened_by: userId,
        reason,
        status: "open",
      })
      .select()
      .single()

    if (disputeError) {
      console.error("[v0] Dispute creation error:", disputeError)
      throw disputeError
    }

    console.log("[v0] Dispute created:", dispute.id)

    await supabase.from("escrows").update({ status: "disputed" }).eq("id", escrow.id)

    await supabase.from("orders").update({ escrow_status: "disputed" }).eq("id", escrow.order_id)

    console.log("[v0] Dispute opened successfully")

    return NextResponse.json({ success: true, disputeId: dispute.id })
  } catch (error: any) {
    console.error("[v0] Error creating dispute:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
