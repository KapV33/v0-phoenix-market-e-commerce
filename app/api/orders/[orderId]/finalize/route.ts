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

    // Get escrow details
    const { data: escrow } = await supabase
      .from("escrows")
      .select(`
        *,
        vendors!inner(user_id)
      `)
      .eq("order_id", params.orderId)
      .eq("buyer_id", user.id)
      .single()

    if (!escrow || escrow.status !== "active") {
      return NextResponse.json({ error: "Escrow not found or already finalized" }, { status: 400 })
    }

    // Get vendor's wallet
    const { data: vendorWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", escrow.vendors.user_id)
      .single()

    if (!vendorWallet) {
      return NextResponse.json({ error: "Vendor wallet not found" }, { status: 404 })
    }

    // Add vendor amount to vendor wallet
    const newVendorBalance = Number.parseFloat(vendorWallet.balance) + Number.parseFloat(escrow.vendor_amount)
    await supabase.from("wallets").update({ balance: newVendorBalance }).eq("id", vendorWallet.id)

    // Record vendor transaction
    await supabase.from("wallet_transactions").insert({
      wallet_id: vendorWallet.id,
      type: "escrow_release",
      amount: escrow.vendor_amount,
      balance_after: newVendorBalance,
      reference_id: params.orderId,
      reference_type: "order",
      description: "Sale completed",
    })

    // Record commission (could go to admin wallet)
    // For now, we just track it in transactions

    // Update escrow status
    await supabase
      .from("escrows")
      .update({
        status: "released",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", escrow.id)

    // Update order escrow status
    await supabase.from("orders").update({ escrow_status: "released" }).eq("id", params.orderId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to finalize order:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
