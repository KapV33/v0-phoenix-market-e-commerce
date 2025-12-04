"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProductCard } from "@/components/marketplace/product-card"
import { CartSidebar } from "@/components/marketplace/cart-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Flame, LogOut, User, Wallet, Search, Shield, TrendingUp, Package, Grid, List, CreditCard } from "lucide-react"
import type { Product, Category, CartItem } from "@/lib/marketplace"
import Link from "next/link"

export default function MarketPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "popular">("newest")
  const router = useRouter()

  useEffect(() => {
    const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
    if (!userId) {
      router.push("/auth/login")
      return
    }

    const savedCart = localStorage.getItem("phoenix_cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }

    Promise.all([
      fetch("/api/marketplace/products").then((res) => res.json()),
      fetch("/api/marketplace/categories").then((res) => res.json()),
    ]).then(([productsData, categoriesData]) => {
      setProducts(productsData)
      setCategories(categoriesData)
      setIsLoading(false)
    })
  }, [router])

  useEffect(() => {
    localStorage.setItem("phoenix_cart", JSON.stringify(cart))
  }, [cart])

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock_quantity) }
            : item,
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) => prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const handleLogout = () => {
    document.cookie = "phoenix_user_id=; path=/; max-age=0"
    localStorage.removeItem("phoenix_cart")
    router.push("/auth/login")
  }

  const handleProfile = () => {
    router.push("/profile")
  }

  const filteredProducts = products
    .filter((p) => !selectedCategory || p.category_id === selectedCategory)
    .filter(
      (p) =>
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  const topLevelCategories = categories.filter((c) => !c.parent_category_id)
  const getCategoryChildren = (parentId: string) => {
    return categories.filter((c) => c.parent_category_id === parentId)
  }

  const stats = {
    totalProducts: products.length,
    activeVendors: [...new Set(products.map((p) => p.vendor_id))].length,
    totalCategories: categories.length,
    escrowProtected: products.length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-16 w-16 mx-auto text-orange-500 animate-pulse mb-4" />
          <p className="text-gray-400">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <header className="border-b border-gray-800 sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/market" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="bg-gradient-to-br from-orange-500 via-red-500 to-yellow-600 p-2 rounded-lg shadow-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                  Phoenix Market
                </h1>
                <p className="text-[10px] text-gray-500">Secure • Anonymous • Trusted</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/market/cards")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Cards Shop
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/wallet")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </Button>
              <CartSidebar items={cart} onRemoveItem={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} />
              <Button
                variant="outline"
                size="icon"
                onClick={handleProfile}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-9 w-9"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 flex gap-6">
        <aside className="w-64 flex-shrink-0 sticky top-20 h-fit space-y-4">
          {/* Market Stats */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Market Stats
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Products</span>
                <span className="text-white font-semibold">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Vendors</span>
                <span className="text-white font-semibold">{stats.activeVendors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Categories</span>
                <span className="text-white font-semibold">{stats.totalCategories}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                <Shield className="h-3 w-3 text-green-500" />
                <span className="text-green-400 text-xs">100% Escrow Protected</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-500" />
              Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                  selectedCategory === null
                    ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 font-medium"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}
              >
                All Products ({products.length})
              </button>
              {topLevelCategories.map((category) => {
                const children = getCategoryChildren(category.id)
                const categoryCount = products.filter(
                  (p) => p.category_id === category.id || children.some((c) => c.id === p.category_id),
                ).length

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                        selectedCategory === category.id
                          ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 font-medium"
                          : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                      }`}
                    >
                      {category.name} ({categoryCount})
                    </button>
                    {children.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {children.map((child) => {
                          const childCount = products.filter((p) => p.category_id === child.id).length
                          return (
                            <button
                              key={child.id}
                              onClick={() => setSelectedCategory(child.id)}
                              className={`w-full text-left px-3 py-1.5 rounded text-xs transition-all ${
                                selectedCategory === child.id
                                  ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-400"
                                  : "text-gray-500 hover:text-gray-400 hover:bg-gray-800/30"
                              }`}
                            >
                              └ {child.name} ({childCount})
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trust & Safety */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Trust & Safety
            </h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5" />
                <span>24-hour escrow protection</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5" />
                <span>Verified vendor system</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5" />
                <span>Dispute resolution</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5" />
                <span>PGP encrypted delivery</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4 mb-4">
            <div className="flex gap-3 items-center">
              <div className="flex-grow relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search products, vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0d1117] border-gray-700 text-gray-300 placeholder:text-gray-600"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-[#0d1117] border border-gray-700 rounded-md text-sm text-gray-300"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="flex gap-1 border border-gray-700 rounded-md">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-700 text-orange-400" : "text-gray-500"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-700 text-orange-400" : "text-gray-500"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : "All Products"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-[#161b22] border border-gray-800 rounded-lg">
              <Package className="h-12 w-12 mx-auto text-gray-700 mb-3" />
              <p className="text-gray-400 text-base">No products found</p>
              <p className="text-xs text-gray-600 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} viewMode={viewMode} />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="bg-[#161b22] border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 py-7">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-7">
            <div>
              <div className="flex items-center gap-1.5 mb-3.5">
                <div className="bg-gradient-to-br from-orange-500 via-red-500 to-yellow-600 p-1.5 rounded-lg shadow-lg">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <span className="text-base font-bold text-white">Phoenix Market</span>
              </div>
              <p className="text-white/60 text-xs">Your trusted darknet marketplace for digital goods and services.</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3.5 text-sm">For Buyers</h3>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/market" className="text-white/70 hover:text-white transition-colors">
                    Browse Products
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="text-white/70 hover:text-white transition-colors">
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link href="/wallet" className="text-white/70 hover:text-white transition-colors">
                    My Wallet
                  </Link>
                </li>
                <li>
                  <Link href="/messages" className="text-white/70 hover:text-white transition-colors">
                    Messages
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-white/70 hover:text-white transition-colors">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3.5 text-sm">For Vendors</h3>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/vendor/apply" className="text-white/70 hover:text-white transition-colors">
                    Become a Vendor
                  </Link>
                </li>
                <li>
                  <Link href="/vendor/dashboard" className="text-white/70 hover:text-white transition-colors">
                    Vendor Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/vendor/pgp-setup" className="text-white/70 hover:text-white transition-colors">
                    PGP Setup
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3.5 text-sm">Support</h3>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/support/new" className="text-white/70 hover:text-white transition-colors">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-7 pt-5 border-t border-gray-800 text-center">
            <p className="text-white/50 text-xs">© 2025 Phoenix Market. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
