import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        escrow:escrows(id, status, auto_finalize_at, amount)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching orders:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transformedData = data?.map((order: any) => ({
      ...order,
      escrow: order.escrow?.[0] || null,
    }))

    return NextResponse.json(transformedData || [])
  } catch (error) {
    console.error("[v0] Failed to fetch orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, productName, productPrice, quantity, cryptoAddress } = body

    if (!userId || !productId || !cryptoAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Create order
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_id: productId,
        product_name: productName,
        product_price: productPrice,
        crypto_address: cryptoAddress,
        payment_status: "pending",
        delivery_status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
