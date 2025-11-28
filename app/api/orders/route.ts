import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: escrows, error } = await supabase
      .from("escrows")
      .select(`
        *,
        orders (
          product_name,
          product_id,
          vendor_id,
          vendors (
            business_name
          )
        )
      `)
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Orders fetch error:", error.message)
      return NextResponse.json([], { status: 200 })
    }

    const orders = (escrows || []).map((escrow: any) => ({
      id: escrow.id,
      product_id: escrow.orders?.product_id || "",
      product_name: escrow.orders?.product_name || "Unknown Product",
      vendor_name: escrow.orders?.vendors?.business_name || "Unknown Vendor",
      amount: escrow.amount,
      status: escrow.status,
      created_at: escrow.created_at,
      auto_finalize_at: escrow.auto_finalize_at,
    }))

    return NextResponse.json(orders)
  } catch (error) {
    console.error("[v0] Orders fetch error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
