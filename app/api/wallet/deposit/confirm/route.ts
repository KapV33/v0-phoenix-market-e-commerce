import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { verifyBTCTransaction, convertBTCtoUSD } from "@/lib/nowpayments"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { txHash, btcAmount, invoiceId } = await request.json()

    if (!txHash || !btcAmount) {
      return NextResponse.json({ error: "Missing transaction details" }, { status: 400 })
    }

    // Verify the transaction on blockchain
    const isValid = await verifyBTCTransaction(txHash, btcAmount)

    if (!isValid) {
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 })
    }

    // Convert BTC to USD
    const usdAmount = await convertBTCtoUSD(btcAmount)

    // Get or create wallet
    let { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", userId).single()

    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()

      if (createError) throw createError
      wallet = newWallet
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
      crypto_tx_hash: txHash,
      description: `BTC deposit: ${btcAmount.toFixed(8)} BTC → $${usdAmount.toFixed(2)} USD`,
    })

    if (txError) throw txError

    return NextResponse.json({
      success: true,
      newBalance,
      depositedUSD: usdAmount,
      depositedBTC: btcAmount,
    })
  } catch (error: any) {
    console.error("Failed to confirm deposit:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
