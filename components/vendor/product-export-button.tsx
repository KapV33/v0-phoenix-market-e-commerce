"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export function ProductExportButton({ products, categories }: any) {
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = () => {
    const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat.slug]))
    const headers = [
      "Name",
      "Slug",
      "Description",
      "Price",
      "Category Slug",
      "Image URL",
      "Stock Quantity",
      "Delivery Content",
    ]
    const rows = products.map((product: any) => {
      const categorySlug = product.category_id ? categoryMap.get(product.category_id) || "" : ""
      return [
        product.name,
        product.slug,
        product.description || "",
        product.price,
        categorySlug,
        product.image_url || "",
        product.stock_quantity,
        product.delivery_content || "",
      ]
    })

    const escapeCSV = (value: string | number) => {
      const stringValue = String(value)
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    return [headers.join(","), ...rows.map((row: any) => row.map(escapeCSV).join(","))].join("\n")
  }

  const handleCopyToClipboard = async () => {
    try {
      setIsExporting(true)
      const csvContent = generateCSV()
      await navigator.clipboard.writeText(csvContent)
      alert(`Successfully copied ${products.length} products to clipboard!`)
    } catch (error) {
      alert("Failed to copy to clipboard")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleCopyToClipboard} disabled={isExporting} variant="outline" className="gap-2 bg-transparent">
      <Copy className="h-4 w-4" />
      {isExporting ? "Copying..." : "Export Products"}
    </Button>
  )
}
