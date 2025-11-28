import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPaymentStatus } from "@/lib/nowpayments"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get IPN data from NOWPayments
    const ipnData = await request.json()

    console.log("[v0] NOWPayments IPN received:", ipnData)

    const { payment_id, payment_status, order_id } = ipnData

    // Only process finished/confirmed payments
    if (payment_status !== "finished" && payment_status !== "confirmed") {
      console.log("[v0] Payment not finished yet, status:", payment_status)
      return NextResponse.json({ success: true })
    }

    // Get full payment details
    const paymentDetails = await getPaymentStatus(payment_id)

    // Extract user ID from order_id (format: deposit_userId_timestamp)
    const userId = order_id.split("_")[1]

    if (!userId) {
      console.error("[v0] Could not extract user ID from order_id:", order_id)
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const usdAmount = Number.parseFloat(paymentDetails.price_amount)

    // Get or create wallet
    let { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle()

    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()

      if (createError) throw createError
      wallet = newWallet
    }

    // Check if this payment was already processed
    const { data: existingTx } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("crypto_tx_hash", payment_id)
      .maybeSingle()

    if (existingTx) {
      console.log("[v0] Payment already processed:", payment_id)
      return NextResponse.json({ success: true, message: "Already processed" })
    }

    // Update wallet balance
    const newBalance = Number.parseFloat(wallet.balance) + usdAmount

    const { error: updateError } = await supabase.from("wallets").update({ balance: newBalance }).eq("id", wallet.id)

    if (updateError) throw updateError

    // Record transaction
    const { error: txError } = await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      type: "deposit",
      amount: usdAmount,
      balance_after: newBalance,
      crypto_tx_hash: payment_id,
      description: `BTC deposit via NOWPayments: ${paymentDetails.pay_amount} ${paymentDetails.pay_currency.toUpperCase()} → $${usdAmount.toFixed(2)} USD`,
    })

    if (txError) throw txError

    console.log("[v0] Deposit processed successfully for user:", userId, "Amount:", usdAmount)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] IPN processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
