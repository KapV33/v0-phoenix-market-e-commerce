import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { amount, txHash } = await request.json()

    let { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", userId).single()

    if (!wallet) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()

      if (createError) throw createError
      wallet = newWallet
    }

    const newBalance = Number.parseFloat(wallet.balance) + amount

    const { error: updateError } = await supabase.from("wallets").update({ balance: newBalance }).eq("id", wallet.id)

    if (updateError) throw updateError

    const { error: txError } = await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      type: "deposit",
      amount,
      balance_after: newBalance,
      crypto_tx_hash: txHash,
      description: `BTC deposit to 1LBRp7sGy4uzfkPqSwov2CAKzNKgHtxPRw`,
    })

    if (txError) throw txError

    return NextResponse.json({ success: true, newBalance })
  } catch (error: any) {
    console.error("Failed to process top-up:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
