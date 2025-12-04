"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, Download, Package, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface VendorCard {
  id: string
  bin: string
  country: string
  price: number
  is_sold: boolean
  purchased_at: string | null
}

export default function VendorCardsPage() {
  const [cards, setCards] = useState<VendorCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const response = await fetch("/api/vendor/cards")
      const data = await response.json()
      setCards(data.cards || [])
    } catch (error) {
      console.error("Failed to fetch cards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/vendor/cards/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Upload failed")
        return
      }

      alert(`Successfully uploaded ${data.count} cards!`)
      fetchCards()
    } catch (error) {
      console.error("Upload error:", error)
      alert("Upload failed. Please try again.")
    }

    event.target.value = ""
  }

  const downloadTemplate = () => {
    const headers = [
      "BIN",
      "Country",
      "Base/Seller",
      "Name",
      "City",
      "State",
      "ZIP",
      "Fullz",
      "Price",
      "Full Card Data",
    ]
    const example = [
      "424242",
      "USA",
      "Chase",
      "John Doe",
      "New York",
      "NY",
      "10001",
      "Yes",
      "25.00",
      "4242424242424242|12|2025|123|John Doe|123 Main St|New York|NY|10001|USA",
    ]

    const csvContent = [headers.join(","), example.join(",")].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cards_upload_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return

    try {
      const response = await fetch(`/api/vendor/cards/${cardId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Card deleted successfully")
        fetchCards()
      } else {
        alert("Failed to delete card")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete card")
    }
  }

  const stats = {
    total: cards.length,
    available: cards.filter((c) => !c.is_sold).length,
    sold: cards.filter((c) => c.is_sold).length,
    revenue: cards.filter((c) => c.is_sold).reduce((sum, c) => sum + c.price, 0),
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Cards Management" />

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{stats.sold}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stats.revenue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Cards</CardTitle>
            <CardDescription>
              Upload your card inventory using our CSV/Excel template. Each row represents one card.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <label>
                <Button asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Cards File
                  </span>
                </Button>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">Template Format:</p>
              <p className="text-muted-foreground">
                Columns: BIN | Country | Base/Seller | Name | City | State | ZIP | Fullz | Price | Full Card Data
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Full Card Data</strong> column contains the complete card information that will be hidden until
                purchase.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cards List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Cards Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No cards uploaded yet. Upload your first batch to get started!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BIN</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sold Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.bin}</TableCell>
                      <TableCell>{card.country}</TableCell>
                      <TableCell className="font-semibold">${card.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {card.is_sold ? <Badge variant="secondary">Sold</Badge> : <Badge>Available</Badge>}
                      </TableCell>
                      <TableCell>
                        {card.purchased_at ? new Date(card.purchased_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {!card.is_sold && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(card.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
