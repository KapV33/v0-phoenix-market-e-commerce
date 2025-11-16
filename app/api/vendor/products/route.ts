import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching vendor products")

    const { client, userId, error } = await getVendorAuthClient()

    if (error || !userId) {
      console.log("[v0] Not authenticated:", error)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: vendor } = await client.from("vendors").select("id").eq("user_id", userId).single()

    console.log("[v0] Vendor lookup:", vendor)

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 403 })
    }

    const { data: products, error: productsError } = await client
      .from("products")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })

    console.log("[v0] Products fetched:", products?.length)

    if (productsError) throw productsError

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error("[v0] Failed to fetch products:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { client, userId, error } = await getVendorAuthClient()

    if (error || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: vendor } = await client.from("vendors").select("id").eq("user_id", userId).single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 403 })
    }

    const {
      name,
      slug,
      description,
      price,
      categoryId,
      imageUrl,
      stockQuantity,
      deliveryContent,
      productType,
      isActive,
      vendorName, // Added vendor name parameter
    } = await request.json()

    const { error: insertError } = await client.from("products").insert({
      vendor_id: vendor.id,
      name,
      slug,
      description,
      price,
      category_id: categoryId || null,
      image_url: imageUrl,
      stock_quantity: stockQuantity,
      delivery_content: deliveryContent,
      product_type: productType || "digital",
      is_active: isActive,
      vendor_name: vendorName || null,
    })

    if (insertError) throw insertError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to create product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
