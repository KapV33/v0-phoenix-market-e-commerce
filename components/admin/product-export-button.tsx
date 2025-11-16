"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Copy } from "lucide-react"

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  category_id: string | null
  image_url: string | null
  stock_quantity: number
  delivery_content: string | null
  is_active: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductExportButtonProps {
  products: Product[]
  categories: Category[]
}

export function ProductExportButton({ products, categories }: ProductExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = () => {
    const categoryMap = new Map(categories.map((cat) => [cat.id, cat.slug]))

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

    const rows = products.map((product) => {
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

    return [headers.join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n")
  }

  const handleCopyToClipboard = async () => {
    try {
      setIsExporting(true)
      const csvContent = generateCSV()

      await navigator.clipboard.writeText(csvContent)
      alert(
        `Successfully copied ${products.length} products to clipboard!\n\nCreate a new file called "products.csv", paste the content, and you can edit and re-upload it.`,
      )
    } catch (error) {
      console.error("[v0] Copy error:", error)
      alert("Failed to copy to clipboard. Please try the download method instead.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = () => {
    try {
      setIsExporting(true)
      const csvContent = generateCSV()

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)

      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `phoenix-market-products-${timestamp}.csv`

      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.style.display = "none"

      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)

      alert(`Successfully exported ${products.length} products to ${filename}`)
    } catch (error) {
      console.error("[v0] Export error:", error)
      alert("Failed to export products. Please try the copy to clipboard option instead.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleExport} disabled={isExporting} variant="outline" className="gap-2 bg-transparent">
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export Products"}
      </Button>
      <Button onClick={handleCopyToClipboard} disabled={isExporting} variant="outline" className="gap-2 bg-transparent">
        <Copy className="h-4 w-4" />
        Copy to Clipboard
      </Button>
    </div>
  )
}
