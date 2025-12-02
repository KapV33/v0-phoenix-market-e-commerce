"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Package, DollarSign, MessageSquare, Loader2 } from "lucide-react"
import { ProductFormDialog } from "@/components/vendor/product-form-dialog"
import { ProductExportButton } from "@/components/vendor/product-export-button"
import { ExcelUpload } from "@/components/vendor/excel-upload"
import { VendorSettings } from "@/components/vendor/vendor-settings"
import { WithdrawalDialog } from "@/components/vendor/withdrawal-dialog"
import { PageHeader } from "@/components/layout/page-header"

interface VendorProfile {
  id: string
  business_name: string
  bio: string | null
  avatar_url: string | null
  status: string
  balance: number
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock_quantity: number
  is_active: boolean
  image_url: string | null
}

interface Message {
  id: string
  user: string
  subject: string
  unread: boolean
  created_at: string
}

export default function VendorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    fetchVendorData()
  }, [])

  const fetchVendorData = async () => {
    try {
      const [vendorRes, productsRes, categoriesRes, messagesRes] = await Promise.all([
        fetch("/api/vendor/profile"),
        fetch("/api/vendor/products"),
        fetch("/api/marketplace/categories"),
        fetch("/api/vendor/messages"),
      ])

      if (vendorRes.status === 403) {
        router.push("/vendor/apply")
        return
      }

      const vendorData = await vendorRes.json()
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      const messagesData = await messagesRes.json()

      setVendor(vendorData.vendor)
      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
      setMessages(messagesData.messages || [])
    } catch (error) {
      console.error("Failed to fetch vendor data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!vendor) {
    return null
  }

  if (vendor.status !== "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Application Pending</h2>
            <p className="text-muted-foreground">
              Your vendor application is currently under review. You'll be notified once it's approved.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Vendor Dashboard" />

      <div className="border-b border-border bg-secondary">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/20">
                <AvatarImage src={vendor.avatar_url || undefined} />
                <AvatarFallback className="bg-white/10 text-white text-2xl">{vendor.business_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-white">{vendor.business_name}</h1>
                <p className="text-white/70">Vendor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-white/70">Available Balance</p>
                <p className="text-2xl font-bold phoenix-gradient-text">${vendor.balance.toFixed(2)}</p>
              </div>
              <WithdrawalDialog vendorId={vendor.id} balance={vendor.balance} onSuccess={fetchVendorData} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-secondary text-white border-border/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Products</CardTitle>
              <Package className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{products.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-secondary text-white border-border/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Active Products</CardTitle>
              <Package className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{products.filter((p) => p.is_active).length}</div>
            </CardContent>
          </Card>

          <Card className="bg-secondary text-white border-border/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${vendor.balance.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-secondary text-white border-border/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{messages.filter((m) => m.unread).length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manage Products</h2>
              <div className="flex gap-2">
                <ProductExportButton products={products} categories={categories} />
                <ProductFormDialog categories={categories} onSuccess={fetchVendorData} />
              </div>
            </div>

            <ExcelUpload onSuccess={fetchVendorData} />

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.slug}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${product.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</p>
                    </div>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <ProductFormDialog product={product} categories={categories} onSuccess={fetchVendorData} />
                  </CardContent>
                </Card>
              ))}
              {products.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p>No products yet. Add your first product to get started!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>View and respond to customer messages</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-12">Messaging system coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <VendorSettings vendor={vendor} onSuccess={fetchVendorData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
