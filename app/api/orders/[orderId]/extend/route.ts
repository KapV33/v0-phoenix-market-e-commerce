import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get escrow
    const { data: escrow } = await supabase
      .from("escrows")
      .select("*")
      .eq("order_id", params.orderId)
      .eq("buyer_id", user.id)
      .single()

    if (!escrow || escrow.status !== "active") {
      return NextResponse.json({ error: "Escrow not found or already finalized" }, { status: 400 })
    }

    if (escrow.extended_count >= 5) {
      return NextResponse.json({ error: "Maximum extensions reached" }, { status: 400 })
    }

    // Extend by 2 days
    const currentFinalize = new Date(escrow.auto_finalize_at)
    const newFinalize = new Date(currentFinalize.getTime() + 2 * 24 * 60 * 60 * 1000)

    await supabase
      .from("escrows")
      .update({
        auto_finalize_at: newFinalize.toISOString(),
        extended_count: escrow.extended_count + 1,
      })
      .eq("id", escrow.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to extend escrow:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
