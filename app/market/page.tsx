"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { ProductCard } from "@/components/marketplace/product-card"
import { CartSidebar } from "@/components/marketplace/cart-sidebar"
import { Button } from "@/components/ui/button"
import { Flame, LogOut, User, Wallet } from 'lucide-react'
import type { Product, Category, CartItem } from "@/lib/marketplace"
import Link from "next/link"

export default function MarketPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
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

  const filteredProducts = selectedCategory ? products.filter((p) => p.category_id === selectedCategory) : products

  const topLevelCategories = categories.filter(c => !c.parent_category_id)
  const getCategoryChildren = (parentId: string) => {
    return categories.filter(c => c.parent_category_id === parentId)
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-16 w-16 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-border shadow-md sticky top-0 z-50 bg-[#162330]/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="phoenix-gradient p-1.5 rounded-lg">
                <Flame className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Phoenix Market</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/wallet")}
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </Button>
              <CartSidebar items={cart} onRemoveItem={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} />
              <Button
                variant="outline"
                size="icon"
                onClick={handleProfile}
                className="border-white/30 text-white hover:bg-white/10 bg-transparent h-9 w-9"
              >
                <User className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-white/30 text-white hover:bg-white/10 bg-transparent h-9 w-9"
              >
                <LogOut className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#162330]">
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3.5 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-all border-r border-white/10 last:border-r-0 ${
                  selectedCategory === null
                    ? "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                All Products
              </button>
              {topLevelCategories.map((category) => {
                const children = getCategoryChildren(category.id)
                const isExpanded = expandedCategories.has(category.id)
                const hasChildren = children.length > 0

                return (
                  <div key={category.id} className="relative group">
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id)
                        if (hasChildren) toggleCategory(category.id)
                      }}
                      className={`px-3.5 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-all border-r border-white/10 ${
                        selectedCategory === category.id
                          ? "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white shadow-lg"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {category.name} {hasChildren && (isExpanded ? '▼' : '▶')}
                    </button>
                    {hasChildren && isExpanded && (
                      <div className="absolute top-full left-0 mt-1 bg-[#162330] border border-white/20 rounded-lg shadow-lg py-1 min-w-[150px] z-10">
                        {children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => setSelectedCategory(child.id)}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${
                              selectedCategory === child.id
                                ? "bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 text-white"
                                : "text-white/70 hover:text-white"
                            }`}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-7 flex-grow">
        <div>
          <div className="flex items-center justify-between mb-5 pb-2.5 border-b-2 border-gradient-to-r from-destructive/30 via-accent/30 to-destructive/30">
            <h2 className="text-lg font-semibold text-secondary">
              {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : "All Products"}
            </h2>
            <p className="text-xs font-medium px-2.5 py-0.5 rounded-full phoenix-gradient text-white shadow-md">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-muted-foreground text-base">No products available</p>
              <p className="text-xs text-muted-foreground mt-1.5">Check back later for new items</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[#162330] border-t border-white/10 mt-auto">
        <div className="container mx-auto px-4 py-7">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-7">
            <div>
              <div className="flex items-center gap-1.5 mb-3.5">
                <div className="phoenix-gradient p-1.5 rounded-lg">
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

          <div className="mt-7 pt-5 border-t border-white/10 text-center">
            <p className="text-white/50 text-xs">© 2025 Phoenix Market. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
