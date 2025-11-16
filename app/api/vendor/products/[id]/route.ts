import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
      vendorName, // Added vendorName parameter
    } = await request.json()

    const { error: updateError } = await client
      .from("products")
      .update({
        name,
        slug,
        description,
        price,
        category_id: categoryId || null,
        image_url: imageUrl,
        stock_quantity: stockQuantity,
        delivery_content: deliveryContent,
        product_type: productType,
        is_active: isActive,
        vendor_name: vendorName || null,
      })
      .eq("id", params.id)
      .eq("vendor_id", vendor.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to update product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { client, userId, error } = await getVendorAuthClient()

    if (error || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: vendor } = await client.from("vendors").select("id").eq("user_id", userId).single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 403 })
    }

    const { error: deleteError } = await client.from("products").delete().eq("id", params.id).eq("vendor_id", vendor.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to delete product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
