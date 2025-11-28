import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This endpoint should be called by a cron job every hour
export async function GET() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Find escrows that are past their auto-finalize time
    const { data: expiredEscrows, error: escrowError } = await supabase
      .from("escrows")
      .select("*")
      .eq("status", "active")
      .lt("auto_finalize_at", new Date().toISOString())

    if (escrowError) throw escrowError

    console.log(`[v0] Auto-finalizing ${expiredEscrows?.length || 0} escrows`)

    for (const escrow of expiredEscrows || []) {
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
        description: `Auto-finalized sale (Order #${escrow.order_id.substring(0, 8)})`,
        reference_type: "order",
        reference_id: escrow.order_id,
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
      await supabase.from("orders").update({ escrow_status: "finalized" }).eq("id", escrow.order_id)
    }

    return NextResponse.json({ success: true, finalized: expiredEscrows?.length || 0 })
  } catch (error: any) {
    console.error("[v0] Error auto-finalizing escrows:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
