import { type NextRequest, NextResponse } from "next/server"
import { updateProduct, deleteProduct } from "@/lib/admin"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const product = await updateProduct(id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price,
      categoryId: body.categoryId,
      imageUrl: body.imageUrl,
      stockQuantity: body.stockQuantity,
      deliveryContent: body.deliveryContent,
      isActive: body.isActive,
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
