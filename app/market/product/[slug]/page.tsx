"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, ArrowLeft, ShoppingCart, Package } from "lucide-react"
import type { Product, CartItem } from "@/lib/marketplace"
import Link from "next/link"

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  useEffect(() => {
    // Check if user is logged in
    const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
    if (!userId) {
      router.push("/auth/login")
      return
    }

    // Fetch product by slug
    fetch(`/api/marketplace/products?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        const foundProduct = data.find((p: Product) => p.slug === slug)
        setProduct(foundProduct || null)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [router, slug])

  const handleAddToCart = () => {
    if (!product) return

    const savedCart = localStorage.getItem("phoenix_cart")
    const cart: CartItem[] = savedCart ? JSON.parse(savedCart) : []

    const existingItem = cart.find((item) => item.product.id === product.id)
    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock_quantity)
    } else {
      cart.push({ product, quantity })
    }

    localStorage.setItem("phoenix_cart", JSON.stringify(cart))
    router.push("/market")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-16 w-16 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-4">Product not found</p>
          <Link href="/market">
            <Button className="phoenix-gradient text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Market
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-[#162330] backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/market">
              <Button
                variant="outline"
                size="icon"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="phoenix-gradient p-2 rounded-lg">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Phoenix Market</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto bg-[#162330] p-6 rounded-lg border border-white/10">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden max-w-md mx-auto w-full">
            {product.image_url ? (
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center phoenix-gradient">
                <span className="text-7xl text-white font-bold">{product.name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
              <p className="text-2xl font-bold phoenix-gradient-text">${product.price.toFixed(2)}</p>
            </div>

            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Availability:</span>
                  <span
                    className={`text-sm font-medium ${product.stock_quantity > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {product.description && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
                <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 border-white/30 text-white hover:bg-white/10"
                >
                  -
                </Button>
                <span className="text-xl font-medium text-white w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                  className="h-10 w-10 border-white/30 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full phoenix-gradient text-white font-semibold text-lg h-12"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>

            {/* Digital Product Info */}
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Digital Product</h3>
                <p className="text-xs text-white/60">
                  This is a digital product. After purchase, you will receive instant access to your content via the
                  orders page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-[#162330] border-t border-white/10 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="phoenix-gradient p-2 rounded-lg">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Phoenix Market</span>
              </div>
              <p className="text-white/60 text-sm">Your trusted darknet marketplace for digital goods and services.</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">For Buyers</h3>
              <ul className="space-y-2 text-sm">
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
              <h3 className="text-white font-semibold mb-4">For Vendors</h3>
              <ul className="space-y-2 text-sm">
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
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/support/new" className="text-white/70 hover:text-white transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="text-white/70 hover:text-white transition-colors">
                    Admin Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/50 text-sm">© 2025 Phoenix Market. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
