import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        products(image_url, product_type),
        escrows(*)
      `)
      .eq("id", params.orderId)
      .eq("user_id", user.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error("Failed to fetch order:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
