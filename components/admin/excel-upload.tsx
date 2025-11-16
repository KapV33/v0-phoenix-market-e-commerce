"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ExcelUploadProps {
  onSuccess: () => void
}

export function ExcelUpload({ onSuccess }: ExcelUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{
    success: number
    failed: number
    errors?: string[]
    warnings?: string[]
  } | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

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
      const errorMsg = error instanceof Error ? error.message : "Failed to upload Excel file"
      alert(errorMsg)
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Upload Products
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload an Excel file to add multiple products at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <p className="text-sm text-foreground font-medium mb-2">File Format Requirements (Excel or CSV):</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Column A: Name (required)</li>
            <li>Column B: Slug (required, lowercase-with-dashes)</li>
            <li>Column C: Description</li>
            <li>Column D: Price (number, required)</li>
            <li>Column E: Category Slug (will be auto-created if missing)</li>
            <li>Column F: Image URL</li>
            <li>Column G: Stock Quantity (number, required)</li>
            <li>Column H: Delivery Content</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3 italic">
            💡 Tip: Use "Export Products" to download the current product list, edit it, and re-upload
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button className="phoenix-gradient text-foreground relative" disabled={isUploading}>
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Excel or CSV File"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            {result.success > 0 && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Successfully imported {result.success} products</span>
              </div>
            )}

            {result.warnings && result.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">{result.warnings.length} warning(s)</span>
                </div>
                <ScrollArea className="h-24 w-full rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <div className="space-y-1">
                    {result.warnings.map((warning, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {warning}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {result.failed > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Failed to import {result.failed} products</span>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <ScrollArea className="h-32 w-full rounded-md border border-border bg-muted/30 p-3">
                    <div className="space-y-1">
                      {result.errors.map((error, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          {error}
                        </p>
                      ))}
                      {result.failed > result.errors.length && (
                        <p className="text-xs text-muted-foreground italic">
                          ... and {result.failed - result.errors.length} more errors
                        </p>
                      )}
                    </div>
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
