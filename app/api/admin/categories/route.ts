import { type NextRequest, NextResponse } from "next/server"
import { getAllCategories, createCategory } from "@/lib/admin"

export async function GET() {
  try {
    const categories = await getAllCategories()
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const category = await createCategory({
      name: body.name,
      slug: body.slug,
      description: body.description,
      imageUrl: body.imageUrl,
      parentCategoryId: body.parentCategoryId, // Added parentCategoryId
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
