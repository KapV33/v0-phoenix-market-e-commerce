import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    console.log("[v0] Fetching orders for user:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: escrows, error } = await supabase
      .from("escrows")
      .select("*, orders(*)")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Orders fetch error:", error.message)
      return NextResponse.json([], { status: 200 })
    }

    console.log("[v0] Found escrows:", escrows?.length || 0)

    const ordersWithVendors = await Promise.all(
      (escrows || []).map(async (escrow: any) => {
        const { data: vendor } = await supabase
          .from("vendors")
          .select("business_name")
          .eq("id", escrow.vendor_id)
          .single()

        return {
          id: escrow.id,
          order_id: escrow.order_id,
          product_id: escrow.orders?.product_id || "",
          product_name: escrow.orders?.product_name || "Unknown Product",
          vendor_name: vendor?.business_name || "Unknown Vendor",
          amount: escrow.amount,
          status: escrow.status,
          created_at: escrow.created_at,
          auto_finalize_at: escrow.auto_finalize_at,
          delivered_content: escrow.orders?.delivered_content || null,
          delivery_status: escrow.orders?.delivery_status || "pending",
        }
      }),
    )

    console.log("[v0] Returning orders:", ordersWithVendors.length)
    return NextResponse.json(ordersWithVendors)
  } catch (error) {
    console.error("[v0] Orders fetch error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
