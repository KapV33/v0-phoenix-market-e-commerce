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
    const { orderId } = await request.json()

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

    // Get or create vendor wallet
    let { data: vendorWallet } = await supabase.from("wallets").select("*").eq("user_id", escrow.vendor_id).single()

    if (!vendorWallet) {
      const { data: newWallet } = await supabase
        .from("wallets")
        .insert({ user_id: escrow.vendor_id, balance: 0 })
        .select()
        .single()
      vendorWallet = newWallet
    }

    // Credit vendor wallet
    const newVendorBalance = Number.parseFloat(vendorWallet.balance) + Number.parseFloat(escrow.vendor_amount)
    await supabase.from("wallets").update({ balance: newVendorBalance }).eq("id", vendorWallet.id)

    // Record vendor transaction
    await supabase.from("wallet_transactions").insert({
      wallet_id: vendorWallet.id,
      type: "escrow_release",
      amount: Number.parseFloat(escrow.vendor_amount),
      balance_after: newVendorBalance,
      description: `Sale completed (Order #${orderId.substring(0, 8)})`,
      reference_type: "order",
      reference_id: orderId,
    })

    // Update escrow status
    await supabase
      .from("escrows")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", escrow.id)

    // Update order
    await supabase.from("orders").update({ escrow_status: "finalized" }).eq("id", orderId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error releasing funds:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
