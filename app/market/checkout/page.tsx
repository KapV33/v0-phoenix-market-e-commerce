"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, ShoppingCart } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import type { CartItem } from "@/lib/marketplace"

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const savedCart = localStorage.getItem("phoenix_cart")
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      if (parsedCart.length === 0) {
        router.push("/market")
      }
      setCart(parsedCart)
    } else {
      router.push("/market")
    }

    fetch("/api/wallet", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch wallet")
        }
        return res.json()
      })
      .then((data) => {
        console.log("[v0] Wallet data:", data)
        if (typeof data.balance === "number") {
          setWalletBalance(data.balance)
        }
      })
      .catch((error) => {
        console.error("[v0] Failed to fetch wallet:", error)
        setWalletBalance(0)
      })
  }, [router])

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const hasInsufficientBalance = walletBalance < total

  const handleCheckout = async () => {
    if (hasInsufficientBalance) {
      alert("Insufficient wallet balance. Please top up your wallet.")
      router.push("/wallet")
      return
    }

    setIsProcessing(true)

    try {
      const orderPromises = cart.map(async (item) => {
        const response = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            productId: item.product.id,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create order")
        }

        return response.json()
      })

      await Promise.all(orderPromises)

      localStorage.removeItem("phoenix_cart")

      alert("Orders placed successfully! Check your orders page.")
      router.push("/orders")
    } catch (error: any) {
      console.error("[v0] Checkout error:", error)
      alert(error.message || "Failed to complete checkout. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Checkout" subtitle="Complete your purchase" showBackButton={true} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-[#162330] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.product.name}</p>
                    <p className="text-sm text-white/70">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-white">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">Total:</span>
                  <span className="text-2xl font-bold phoenix-gradient-text">${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#162330] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#0f1419] p-4 rounded-lg border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Wallet Balance:</span>
                  <span className="text-lg font-bold text-white">${walletBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Order Total:</span>
                  <span className="text-lg font-semibold text-white">${total.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Balance After:</span>
                    <span className={`text-lg font-bold ${hasInsufficientBalance ? "text-red-400" : "text-green-400"}`}>
                      ${(walletBalance - total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {hasInsufficientBalance && (
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <p className="text-sm text-white">
                    <strong>Insufficient Balance:</strong> You need ${(total - walletBalance).toFixed(2)} more to
                    complete this purchase.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full border-red-500/30 text-white hover:bg-red-500/10 bg-transparent"
                    onClick={() => router.push("/wallet")}
                  >
                    Top Up Wallet
                  </Button>
                </div>
              )}

              <div className="bg-[#0f1419] p-4 rounded-lg border border-white/10 space-y-2">
                <p className="text-sm text-white font-medium">Escrow Protection:</p>
                <ol className="text-sm text-white/80 space-y-1 list-decimal list-inside">
                  <li>Payment held in secure escrow</li>
                  <li>Digital products delivered instantly</li>
                  <li>Release payment or auto-finalize in 24h</li>
                  <li>Dispute option if issues arise</li>
                </ol>
              </div>

              <Button
                className="w-full phoenix-gradient text-white font-semibold"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing || hasInsufficientBalance}
              >
                {isProcessing ? "Processing..." : `Pay $${total.toFixed(2)} from Wallet`}
              </Button>

              <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <p className="text-xs text-white">
                  <strong>Secure Payment:</strong> Your payment is protected by our escrow system. Funds are only
                  released to the vendor after you confirm delivery or auto-finalize period ends.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
