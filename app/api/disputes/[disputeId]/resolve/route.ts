import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { disputeId: string } }) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { buyerPercentage, vendorPercentage, resolutionNotes } = await request.json()

    console.log("[v0] Resolving dispute:", params.disputeId, "Split:", buyerPercentage, vendorPercentage)

    // Validate percentages
    if (buyerPercentage + vendorPercentage !== 100) {
      return NextResponse.json({ error: "Percentages must add up to 100%" }, { status: 400 })
    }

    // Get dispute with escrow info
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .select(`
        *,
        escrows!inner(
          id,
          amount,
          vendor_id,
          buyer_id,
          order_id,
          vendor_amount,
          commission_amount
        )
      `)
      .eq("id", params.disputeId)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    // Check authorization (admin or vendor)
    const { data: isAdmin } = await supabase.from("admins").select("id").eq("id", userId).maybeSingle()
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", userId)
      .eq("id", dispute.escrows.vendor_id)
      .maybeSingle()

    if (!isAdmin && !vendor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const escrow = dispute.escrows
    const totalAmount = Number.parseFloat(escrow.amount)
    const buyerAmount = (totalAmount * buyerPercentage) / 100
    const vendorAmount = (totalAmount * vendorPercentage) / 100

    console.log("[v0] Amounts - Total:", totalAmount, "Buyer:", buyerAmount, "Vendor:", vendorAmount)

    // Refund buyer if percentage > 0
    if (buyerPercentage > 0) {
      let { data: buyerWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", escrow.buyer_id)
        .maybeSingle()

      if (!buyerWallet) {
        const { data: newWallet } = await supabase
          .from("wallets")
          .insert({ user_id: escrow.buyer_id, balance: 0 })
          .select()
          .single()
        buyerWallet = newWallet!
      }

      const newBuyerBalance = Number.parseFloat(buyerWallet.balance) + buyerAmount
      await supabase.from("wallets").update({ balance: newBuyerBalance }).eq("id", buyerWallet.id)

      await supabase.from("wallet_transactions").insert({
        wallet_id: buyerWallet.id,
        type: "dispute_refund",
        amount: buyerAmount,
        balance_after: newBuyerBalance,
        description: `Dispute resolution refund (${buyerPercentage}%)`,
        reference_type: "dispute",
        reference_id: dispute.id,
      })
    }

    // Credit vendor if percentage > 0
    if (vendorPercentage > 0) {
      const { data: vendorUser } = await supabase.from("vendors").select("user_id").eq("id", escrow.vendor_id).single()

      let { data: vendorWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", vendorUser!.user_id)
        .maybeSingle()

      if (!vendorWallet) {
        const { data: newWallet } = await supabase
          .from("wallets")
          .insert({ user_id: vendorUser!.user_id, balance: 0 })
          .select()
          .single()
        vendorWallet = newWallet!
      }

      const newVendorBalance = Number.parseFloat(vendorWallet.balance) + vendorAmount
      await supabase.from("wallets").update({ balance: newVendorBalance }).eq("id", vendorWallet.id)

      await supabase.from("wallet_transactions").insert({
        wallet_id: vendorWallet.id,
        type: "dispute_payout",
        amount: vendorAmount,
        balance_after: newVendorBalance,
        description: `Dispute resolution payout (${vendorPercentage}%)`,
        reference_type: "dispute",
        reference_id: dispute.id,
      })
    }

    // Update dispute status
    const resolutionStatus =
      buyerPercentage === 100 ? "resolved_buyer" : vendorPercentage === 100 ? "resolved_vendor" : "resolved_partial"

    await supabase
      .from("disputes")
      .update({
        status: resolutionStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_notes: resolutionNotes || `Split: ${buyerPercentage}% buyer, ${vendorPercentage}% vendor`,
      })
      .eq("id", dispute.id)

    // Update escrow
    await supabase
      .from("escrows")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", escrow.id)

    // Update order
    await supabase.from("orders").update({ escrow_status: "finalized" }).eq("id", escrow.order_id)

    console.log("[v0] Dispute resolved successfully")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error resolving dispute:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
