"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductFormDialog } from "@/components/admin/product-form-dialog"
import { CategoryFormDialog } from "@/components/admin/category-form-dialog"
import { ExcelUpload } from "@/components/admin/excel-upload"
import { ProductExportButton } from "@/components/admin/product-export-button"
import {
  Flame,
  Shield,
  LogOut,
  Edit,
  Trash2,
  Package,
  FolderOpen,
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
  Save,
  Search,
  User,
} from "lucide-react"
import type { Product, Category } from "@/lib/marketplace"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface WalletData {
  id: string
  user_id: string
  username: string
  balance: number
  created_at: string
  updated_at: string
}

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: "product" | "category" | null
    id: string | null
  }>({
    open: false,
    type: null,
    id: null,
  })
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    title: string
    message: string
    variant: "success" | "error"
  }>({
    open: false,
    title: "",
    message: "",
    variant: "success",
  })

  const [commissionRate, setCommissionRate] = useState<number>(10)
  const [isSaving, setIsSaving] = useState(false)
  const [financeStats, setFinanceStats] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    totalEscrow: 0,
  })
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ])

      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFinanceData = async () => {
    try {
      const response = await fetch("/api/admin/finances", { credentials: "include" })
      if (!response.ok) throw new Error("Failed to load finance data")

      const data = await response.json()
      setCommissionRate(data.commissionRate || 10)
      setFinanceStats(data.stats || { totalRevenue: 0, totalCommissions: 0, totalEscrow: 0 })
    } catch (error) {
      console.error("Failed to load finance data:", error)
    }
  }

  const loadWallets = async () => {
    try {
      const response = await fetch("/api/admin/wallets", { credentials: "include" })
      if (!response.ok) throw new Error("Failed to load wallets")

      const data = await response.json()
      setWallets(data)
    } catch (error) {
      console.error("Failed to load wallets:", error)
    }
  }

  const handleSaveCommission = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/finances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate }),
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to save commission rate")

      setAlertDialog({
        open: true,
        title: "Success",
        message: "Commission rate updated successfully!",
        variant: "success",
      })
    } catch (error) {
      setAlertDialog({
        open: true,
        title: "Error",
        message: "Failed to update commission rate",
        variant: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    document.cookie = "phoenix_admin_id=; path=/; max-age=0"
    router.push("/admin/login")
  }

  const handleNavigateToVendors = () => {
    router.push("/admin/vendors")
  }

  const handleDeleteProduct = async (id: string) => {
    setDeleteDialog({ open: true, type: "product", id })
  }

  const handleDeleteCategory = async (id: string) => {
    setDeleteDialog({ open: true, type: "category", id })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return

    try {
      const endpoint =
        deleteDialog.type === "product"
          ? `/api/admin/products/${deleteDialog.id}`
          : `/api/admin/categories/${deleteDialog.id}`

      const response = await fetch(endpoint, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      loadData()
      setDeleteDialog({ open: false, type: null, id: null })
      setAlertDialog({
        open: true,
        title: "Success",
        message: `${deleteDialog.type === "product" ? "Product" : "Category"} deleted successfully!`,
        variant: "success",
      })
    } catch (error) {
      setAlertDialog({
        open: true,
        title: "Error",
        message: `Failed to delete ${deleteDialog.type}`,
        variant: "error",
      })
      setDeleteDialog({ open: false, type: null, id: null })
    }
  }

  useEffect(() => {
    loadData()
    loadFinanceData()
    loadWallets()
  }, [])

  const filteredWallets = wallets.filter(
    (wallet) =>
      wallet.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.user_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalWalletBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-16 w-16 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-secondary backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/market" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative">
                <Flame className="h-8 w-8 text-white phoenix-gradient p-1.5 rounded-lg" />
                <Shield className="h-4 w-4 text-white absolute -bottom-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Phoenix Market</h1>
                <p className="text-xs text-white/70">Admin Dashboard</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleNavigateToVendors}
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <Users className="mr-2 h-4 w-4" />
                Vendors
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 bg-secondary text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Products</CardTitle>
              <Package className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold phoenix-gradient-text">{products.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-secondary text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Active Products</CardTitle>
              <Package className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold phoenix-gradient-text">
                {products.filter((p) => p.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-secondary text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Categories</CardTitle>
              <FolderOpen className="h-4 w-4 text-white/60" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold phoenix-gradient-text">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Products Management</h2>
              <div className="flex gap-2">
                <ProductExportButton products={products} categories={categories} />
                <ProductFormDialog categories={categories} onSuccess={loadData} />
              </div>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id} className="border-border/50 bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center phoenix-gradient">
                            <span className="text-xl text-white font-bold">{product.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                            <p className="text-sm text-foreground/70 line-clamp-2 mt-1">{product.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-lg font-bold phoenix-gradient-text">
                                ${product.price.toFixed(2)}
                              </span>
                              <span className="text-sm text-foreground/60">Stock: {product.stock_quantity}</span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${product.is_active ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}
                              >
                                {product.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <ProductFormDialog
                              product={product}
                              categories={categories}
                              onSuccess={loadData}
                              trigger={
                                <Button size="icon" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button size="icon" variant="outline" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No products yet. Add your first product!</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Categories Management</h2>
              <CategoryFormDialog categories={categories} onSuccess={loadData} />
            </div>

            <div className="grid gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="border-border/50 bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-white">{category.name}</h3>
                        <p className="text-sm text-primary">{category.description}</p>
                        <p className="text-xs mt-1 text-accent">Slug: {category.slug}</p>
                      </div>
                      <div className="flex gap-2">
                        <CategoryFormDialog
                          category={category}
                          categories={categories}
                          onSuccess={loadData}
                          trigger={
                            <Button size="icon" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button size="icon" variant="outline" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {categories.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No categories yet. Add your first category!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="finances" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Financial Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/50 bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">${financeStats.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Commissions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold phoenix-gradient-text">
                    ${financeStats.totalCommissions.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">In Escrow</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">${financeStats.totalEscrow.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Commission Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionRate" className="text-foreground">
                    Marketplace Commission Rate (%)
                  </Label>
                  <div className="flex gap-4">
                    <Input
                      id="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number.parseFloat(e.target.value))}
                      className="max-w-xs bg-input border-border text-foreground"
                    />
                    <Button onClick={handleSaveCommission} disabled={isSaving} className="phoenix-gradient text-white">
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-sm text-foreground/60">
                    This percentage will be deducted from vendor earnings on each sale
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-2">Admin Bitcoin Wallet</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-mono text-foreground break-all">1LBRp7sGy4uzfkPqSwov2CAKzNKgHtxPRw</p>
                  </div>
                  <p className="text-xs text-foreground/60 mt-2">All commission deposits are sent to this address</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallets" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Wallet Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/50 bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Wallets</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{wallets.length}</div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Balance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold phoenix-gradient-text">${totalWalletBalance.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Active Users</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {wallets.filter((w) => w.balance > 0).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 bg-card">
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or user ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-input border-border text-foreground"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredWallets.map((wallet) => (
                <Card key={wallet.id} className="border-border/50 bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{wallet.username || "Unknown User"}</h3>
                          <p className="text-sm text-foreground/60">ID: {wallet.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold phoenix-gradient-text">${wallet.balance.toFixed(2)}</div>
                        <p className="text-xs text-foreground/60">
                          Updated: {new Date(wallet.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredWallets.length === 0 && (
                <div className="text-center py-12">
                  <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No wallets found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Bulk Product Upload</h2>
            <ExcelUpload onSuccess={loadData} />
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="bg-[#1a1f2e] border-orange-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this {deleteDialog.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent className="bg-[#1a1f2e] border-orange-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle
              className={`flex items-center gap-2 ${alertDialog.variant === "success" ? "text-green-500" : "text-red-500"}`}
            >
              {alertDialog.variant === "success" ? <Save className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
              {alertDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">{alertDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-orange-600 text-white hover:bg-orange-700">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
