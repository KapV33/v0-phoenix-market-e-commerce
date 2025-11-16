import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories (
          slug
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Create Excel data with headers matching the upload format exactly
    const excelData = [
      ["Name", "Slug", "Description", "Price", "Category Slug", "Image URL", "Stock Quantity", "Delivery Content"],
    ]

    // Add product rows
    for (const product of products || []) {
      excelData.push([
        product.name || "",
        product.slug || "",
        product.description || "",
        product.price || 0,
        product.categories?.slug || "",
        product.image_url || "",
        product.stock_quantity || 0,
        product.delivery_content || "",
      ])
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 30 }, // Name
      { wch: 20 }, // Slug
      { wch: 50 }, // Description
      { wch: 10 }, // Price
      { wch: 20 }, // Category Slug
      { wch: 50 }, // Image URL
      { wch: 15 }, // Stock Quantity
      { wch: 50 }, // Delivery Content
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Products")

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `phoenix-market-products-${timestamp}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    console.error("Export error:", errorMsg)
    return NextResponse.json({ error: `Failed to export products: ${errorMsg}` }, { status: 500 })
  }
}
