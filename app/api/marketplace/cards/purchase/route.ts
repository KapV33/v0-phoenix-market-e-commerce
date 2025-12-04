import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { cardId } = await request.json()

    if (!cardId) {
      return NextResponse.json({ error: "Card ID required" }, { status: 400 })
    }

    const userId = request.cookies.get("phoenix_user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .eq("is_sold", false)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: "Card not found or already sold" }, { status: 404 })
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    if (wallet.balance < card.price) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    const newBuyerBalance = wallet.balance - card.price
    await supabase
      .from("wallets")
      .update({ balance: newBuyerBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id)

    const { data: commissionSettings } = await supabase
      .from("commission_settings")
      .select("commission_percentage")
      .eq("setting_type", "global")
      .limit(1)
      .maybeSingle()

    const commissionRate = commissionSettings?.commission_percentage || 5
    const commissionAmount = (card.price * commissionRate) / 100
    const vendorAmount = card.price - commissionAmount

    const { data: vendorWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", (await supabase.from("vendors").select("user_id").eq("id", card.vendor_id).single()).data?.user_id)
      .single()

    if (vendorWallet) {
      await supabase
        .from("wallets")
        .update({
          balance: vendorWallet.balance + vendorAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorWallet.id)
    }

    await supabase
      .from("cards")
      .update({
        is_sold: true,
        buyer_id: userId,
        purchased_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", cardId)

    await supabase.from("card_purchases").insert({
      card_id: cardId,
      buyer_id: userId,
      vendor_id: card.vendor_id,
      price: card.price,
    })

    await supabase.from("wallet_transactions").insert([
      {
        wallet_id: wallet.id,
        type: "purchase",
        amount: -card.price,
        balance_after: newBuyerBalance,
        description: `Card purchase: ${card.bin}`,
        reference_type: "card_purchase",
        reference_id: cardId,
      },
      {
        wallet_id: vendorWallet?.id,
        type: "sale",
        amount: vendorAmount,
        balance_after: vendorWallet ? vendorWallet.balance + vendorAmount : 0,
        description: `Card sale: ${card.bin}`,
        reference_type: "card_purchase",
        reference_id: cardId,
      },
    ])

    return NextResponse.json({
      success: true,
      full_card_data: card.full_card_data,
      newBalance: newBuyerBalance,
    })
  } catch (error) {
    console.error("[v0] Card purchase error:", error)
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 })
  }
}
