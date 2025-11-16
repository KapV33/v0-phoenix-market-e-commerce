import { type NextRequest, NextResponse } from "next/server"
import { getAllProducts, createProduct } from "@/lib/admin"

export async function GET() {
  try {
    const products = await getAllProducts()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = await createProduct({
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
