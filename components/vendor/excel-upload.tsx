"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

export function ExcelUpload({ onSuccess }: any) {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/vendor/products/template")
      if (!response.ok) throw new Error("Failed to download template")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "phoenix_market_products_template.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert("Failed to download template")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/vendor/products/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Upload failed")

      setResult({
        success: data.success,
        failed: data.failed,
        errors: data.errors,
        warnings: data.warnings,
      })

      if (data.success > 0) {
        onSuccess()
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Upload Products
        </CardTitle>
        <CardDescription>Upload Excel or CSV file to add multiple products at once</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 text-gray-900">Excel Format Guide</h4>
          <p className="text-xs text-gray-700 mb-3">
            Your Excel file should have these columns in order:
          </p>
          <ol className="text-xs text-gray-700 list-decimal list-inside space-y-1 mb-3">
            <li><strong>Name</strong> - Product name (required)</li>
            <li><strong>Slug</strong> - URL-friendly identifier (required)</li>
            <li><strong>Description</strong> - Product description</li>
            <li><strong>Price</strong> - Price in USD (required)</li>
            <li><strong>Category Slug</strong> - Category identifier (creates if doesn't exist)</li>
            <li><strong>Image URL</strong> - Product image URL</li>
            <li><strong>Stock Quantity</strong> - Available quantity (required)</li>
            <li><strong>Delivery Content</strong> - License keys, links, etc.</li>
            <li><strong>Vendor/Brand Name</strong> - Your business or brand name</li>
          </ol>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadTemplate}
            className="w-full bg-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        <Button className="phoenix-gradient w-full relative" disabled={isUploading}>
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload File"}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />
        </Button>

        {result && (
          <div className="space-y-3">
            {result.success > 0 && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Successfully imported {result.success} products</span>
              </div>
            )}
            {result.warnings && result.warnings.length > 0 && (
              <ScrollArea className="h-24 rounded-md border p-3">
                {result.warnings.map((warning: string, idx: number) => (
                  <p key={idx} className="text-xs text-muted-foreground">
                    {warning}
                  </p>
                ))}
              </ScrollArea>
            )}
            {result.failed > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Failed {result.failed} products</span>
                </div>
                {result.errors && (
                  <ScrollArea className="h-32 rounded-md border p-3">
                    {result.errors.map((error: string, idx: number) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {error}
                      </p>
                    ))}
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
