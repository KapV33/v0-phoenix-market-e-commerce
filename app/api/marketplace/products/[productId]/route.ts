import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const supabase = await createServerClient()

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        vendors(business_name)
      `)
      .eq("id", params.productId)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error("Failed to fetch product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
