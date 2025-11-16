import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"
import * as XLSX from "xlsx"

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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const workbook = XLSX.read(bytes)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    const rows = data.slice(1) as any[]
    let successCount = 0
    let failedCount = 0
    const errors: string[] = []
    const warnings: string[] = []

    const { data: categories } = await client.from("categories").select("id, slug, name")

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const [name, slug, description, price, categorySlug, imageUrl, stockQuantity, deliveryContent, vendorName] = row

      if (!name || !slug || !price || !stockQuantity) {
        errors.push(`Row ${i + 2}: Missing required fields (name, slug, price, stockQuantity)`)
        failedCount++
        continue
      }

      let categoryId = null
      if (categorySlug) {
        let category = categories?.find((c) => c.slug === categorySlug)
        if (!category) {
          const { data: newCat } = await client
            .from("categories")
            .insert({ name: categorySlug, slug: categorySlug })
            .select()
            .single()
          category = newCat
          warnings.push(`Row ${i + 2}: Created new category "${categorySlug}"`)
        }
        categoryId = category?.id
      }

      if (!imageUrl) {
        warnings.push(`Row ${i + 2}: No image URL provided for product "${name}"`)
      }

      const existingSlug = await client
        .from("products")
        .select("id")
        .eq("slug", slug)
        .eq("vendor_id", vendor.id)
        .maybeSingle()

      if (existingSlug.data) {
        const { error: updateError } = await client
          .from("products")
          .update({
            name,
            description: description || null,
            price: Number.parseFloat(price),
            category_id: categoryId,
            image_url: imageUrl || null,
            stock_quantity: Number.parseInt(stockQuantity),
            delivery_content: deliveryContent || null,
            vendor_name: vendorName || null,
          })
          .eq("id", existingSlug.data.id)

        if (updateError) {
          errors.push(`Row ${i + 2}: ${updateError.message}`)
          failedCount++
        } else {
          successCount++
          warnings.push(`Row ${i + 2}: Updated existing product "${name}"`)
        }
      } else {
        const { error: insertError } = await client.from("products").insert({
          vendor_id: vendor.id,
          name,
          slug,
          description: description || null,
          price: Number.parseFloat(price),
          category_id: categoryId,
          image_url: imageUrl || null,
          stock_quantity: Number.parseInt(stockQuantity),
          delivery_content: deliveryContent || null,
          product_type: "digital",
          is_active: true,
          vendor_name: vendorName || null,
        })

        if (insertError) {
          errors.push(`Row ${i + 2}: ${insertError.message}`)
          failedCount++
        } else {
          successCount++
        }
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10),
      warnings: warnings.slice(0, 20),
    })
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
