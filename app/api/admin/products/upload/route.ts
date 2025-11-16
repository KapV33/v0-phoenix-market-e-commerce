import { type NextRequest, NextResponse } from "next/server"
import { upsertProduct } from "@/lib/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Processing Excel file:", file.name)

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

    console.log("[v0] Parsed Excel data, rows:", data.length)

    if (data.length < 2) {
      return NextResponse.json({ error: "File must contain header and at least one product" }, { status: 400 })
    }

    const supabase = createAdminClient()
    let success = 0
    let failed = 0
    const errors: string[] = []
    const warnings: string[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i]

      if (!row || row.length === 0 || !row[0]) {
        continue
      }

      try {
        const name = row[0]?.toString().trim()
        const slug = row[1]?.toString().trim()
        const description = row[2]?.toString().trim() || ""
        const priceStr = row[3]?.toString().trim()
        const categorySlug = row[4]?.toString().trim()
        const imageUrl = row[5]?.toString().trim() || ""
        const stockStr = row[6]?.toString().trim()
        const deliveryContent = row[7]?.toString().trim() || ""

        if (!name || !slug || !priceStr || !stockStr) {
          console.error(`[v0] Row ${i + 1}: Missing required fields`)
          errors.push(`Row ${i + 1}: Missing required fields (name, slug, price, or stock)`)
          failed++
          continue
        }

        const price = Number.parseFloat(priceStr)
        const stockQuantity = Number.parseInt(stockStr)

        if (Number.isNaN(price) || Number.isNaN(stockQuantity)) {
          console.error(`[v0] Row ${i + 1}: Invalid price or stock quantity`)
          errors.push(`Row ${i + 1}: Invalid price or stock quantity`)
          failed++
          continue
        }

        let categoryId = null
        if (categorySlug) {
          const { data: category, error: categoryError } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", categorySlug)
            .maybeSingle()

          if (categoryError) {
            console.error(`[v0] Row ${i + 1}: Category lookup error:`, categoryError)
          } else if (category) {
            categoryId = category.id
          } else {
            // Category doesn't exist, create it
            console.log(`[v0] Row ${i + 1}: Creating new category: ${categorySlug}`)
            const { data: newCategory, error: createError } = await supabase
              .from("categories")
              .insert({
                name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
                slug: categorySlug,
                description: `Auto-created category for ${categorySlug}`,
              })
              .select("id")
              .single()

            if (createError) {
              console.error(`[v0] Row ${i + 1}: Failed to create category:`, createError)
              warnings.push(`Row ${i + 1}: Category "${categorySlug}" not found and could not be created`)
            } else if (newCategory) {
              categoryId = newCategory.id
              console.log(`[v0] Row ${i + 1}: Category created successfully with ID: ${categoryId}`)
            }
          }
        }

        if (!imageUrl) {
          console.warn(`[v0] Row ${i + 1}: No image URL provided for product "${name}"`)
          warnings.push(`Row ${i + 1}: Product "${name}" has no image`)
        } else {
          console.log(`[v0] Row ${i + 1}: Image URL: ${imageUrl}`)
        }

        console.log(`[v0] Row ${i + 1}: Creating product "${name}" with category ID: ${categoryId}`)

        const result = await upsertProduct({
          name,
          slug,
          description,
          price,
          categoryId,
          imageUrl,
          stockQuantity,
          deliveryContent,
          isActive: true,
        })

        if (result.updated) {
          console.log(`[v0] Row ${i + 1}: Product updated successfully`)
        } else {
          console.log(`[v0] Row ${i + 1}: Product created successfully`)
        }
        success++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        console.error(`[v0] Row ${i + 1}: Failed to create product:`, errorMsg)
        errors.push(`Row ${i + 1}: ${errorMsg}`)
        failed++
      }
    }

    console.log(`[v0] Upload complete. Success: ${success}, Failed: ${failed}`)

    return NextResponse.json({
      success,
      failed,
      errors: errors.slice(0, 10),
      warnings: warnings.slice(0, 10),
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Excel upload error:", errorMsg)
    return NextResponse.json({ error: `Failed to process file: ${errorMsg}` }, { status: 500 })
  }
}
