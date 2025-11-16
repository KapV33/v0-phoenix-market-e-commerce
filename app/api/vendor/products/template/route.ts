import { NextRequest, NextResponse } from "next/server"
import { read, utils, write } from "xlsx"

export async function GET(request: NextRequest) {
  try {
    // Create template data
    const template = [
      ["Name", "Slug", "Description", "Price", "Category Slug", "Image URL", "Stock Quantity", "Delivery Content", "Vendor/Brand Name"],
      [
        "Example Product",
        "example-product",
        "This is a sample product description",
        "29.99",
        "digital-goods",
        "https://example.com/image.jpg",
        "100",
        "License key: ABC123",
        "My Brand"
      ],
      [
        "Another Product",
        "another-product",
        "Second example product",
        "49.99",
        "services",
        "",
        "50",
        "",
        "Phoenix Market"
      ],
    ]

    // Create workbook and worksheet
    const worksheet = utils.aoa_to_sheet(template)
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, worksheet, "Products")

    // Generate buffer
    const buffer = write(workbook, { type: "buffer", bookType: "xlsx" })

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=phoenix_market_products_template.xlsx",
      },
    })
  } catch (error) {
    console.error("Template generation error:", error)
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 })
  }
}
