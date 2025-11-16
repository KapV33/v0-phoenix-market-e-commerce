"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShoppingCart, AlertCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  image_url: string | null
  product_type: string
  vendor_id: string
  vendors: {
    business_name: string
  }
}

export default function CheckoutPage({ params }: { params: { productId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCheckoutData()
  }, [])

  const fetchCheckoutData = async () => {
    try {
      const [productRes, walletRes] = await Promise.all([
        fetch(`/api/marketplace/products/${params.productId}`),
        fetch("/api/wallet"),
      ])

      const productData = await productRes.json()
      const walletData = await walletRes.json()

      setProduct(productData.product)
      setBalance(walletData.balance || 0)
    } catch (error) {
      console.error("Failed to fetch checkout data:", error)
      setError("Failed to load checkout data")
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!product) return

    if (balance < product.price) {
      setError("Insufficient balance. Please top up your wallet.")
      return
    }

    setProcessing(true)
    setError("")

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order")
      }

      router.push(`/orders/${data.orderId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Product not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-white">Checkout</h1>

        <Card className="bg-[#162330] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white">{product.name}</h3>
                <p className="text-sm text-white/70">Sold by: {product.vendors.business_name}</p>
                <Badge variant="secondary" className="mt-2">
                  {product.product_type === "digital" ? "Digital Product" : "Physical Product"}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold phoenix-gradient-text">${product.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70">Your Wallet Balance:</span>
                <span className="font-semibold text-white">${balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">After Purchase:</span>
                <span className="font-semibold text-white">${(balance - product.price).toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-[#0f1419] p-4 rounded-lg space-y-2 border border-white/10">
              <h4 className="font-semibold text-white">Escrow Protection</h4>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• Your payment will be held in escrow</li>
                <li>• {product.product_type === "digital" ? "24 hours" : "5 days"} to review your purchase</li>
                <li>• You can extend the timer by 2 days if needed</li>
                <li>• Funds released to vendor after you finalize or auto-finalize</li>
                <li>• Open a dispute if there's an issue</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.back()} className="flex-1 border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={processing || balance < product.price}
                className="flex-1 phoenix-gradient text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Complete Purchase
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
