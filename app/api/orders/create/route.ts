import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js" // Use direct Supabase client instead of wrapper
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { productId } = await request.json()

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*, vendors!inner(id, user_id)")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    let { data: wallet, error: walletError } = await supabase.from("wallets").select("*").eq("user_id", userId).single()

    // If wallet doesn't exist, create it
    if (walletError && walletError.code === "PGRST116") {
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()

      if (createError) throw createError
      wallet = newWallet
    } else if (walletError) {
      throw walletError
    }

    if (!wallet || wallet.balance < product.price) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Get commission settings
    const { data: globalCommission } = await supabase
      .from("commission_settings")
      .select("commission_percentage")
      .eq("setting_type", "global")
      .single()

    const commissionRate = globalCommission?.commission_percentage || 10
    const commissionAmount = (product.price * commissionRate) / 100
    const vendorAmount = product.price - commissionAmount

    // Deduct from buyer's wallet
    const newBuyerBalance = Number.parseFloat(wallet.balance) - product.price
    await supabase.from("wallets").update({ balance: newBuyerBalance }).eq("id", wallet.id)

    // Record transaction
    await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      type: "escrow_lock",
      amount: -product.price,
      balance_after: newBuyerBalance,
      description: `Purchase: ${product.name}`,
    })

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_id: product.id,
        vendor_id: product.vendor_id,
        product_name: product.name,
        product_price: product.price,
        payment_status: "completed",
        delivery_status: product.product_type === "digital" ? "delivered" : "pending",
        delivered_content: product.product_type === "digital" ? product.delivery_content : null,
        escrow_status: "active",
        crypto_address: "1LBRp7sGy4uzfkPqSwov2CAKzNKgHtxPRw", // Admin BTC wallet for tracking
        payment_tx_hash: `wallet_payment_${Date.now()}`, // Wallet-based payment identifier
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Calculate auto-finalize time
    const autoFinalizeHours = product.product_type === "digital" ? 24 : 120 // 24 hours or 5 days
    const autoFinalizeAt = new Date(Date.now() + autoFinalizeHours * 60 * 60 * 1000)

    // Create escrow
    await supabase.from("escrows").insert({
      order_id: order.id,
      buyer_id: userId,
      vendor_id: product.vendor_id,
      amount: product.price,
      commission_amount: commissionAmount,
      vendor_amount: vendorAmount,
      status: "active",
      product_type: product.product_type,
      auto_finalize_at: autoFinalizeAt.toISOString(),
    })

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error: any) {
    console.error("Failed to create order:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
