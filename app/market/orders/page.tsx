"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, ArrowLeft, CheckCircle, Clock, Download, Copy } from "lucide-react"

interface Order {
  id: string
  product_name: string
  product_price: number
  payment_status: string
  delivery_status: string
  delivered_content: string | null
  payment_tx_hash: string | null
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
    if (!userId) {
      router.push("/auth/login")
      return
    }

    // Fetch user orders
    fetch(`/api/marketplace/orders?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data)
        setIsLoading(false)
      })
  }, [router])

  const handleCopyContent = (orderId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(orderId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold phoenix-gradient-text">Phoenix Market</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.push("/market")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Market
        </Button>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Your Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No orders yet</p>
                <Button className="mt-4 phoenix-gradient text-foreground" onClick={() => router.push("/market")}>
                  Start Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{order.product_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-bold phoenix-gradient-text">${order.product_price.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {order.payment_status === "confirmed" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-muted-foreground">
                          Payment: <span className="capitalize">{order.payment_status}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {order.delivery_status === "delivered" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-muted-foreground">
                          Delivery: <span className="capitalize">{order.delivery_status}</span>
                        </span>
                      </div>
                    </div>

                    {order.payment_tx_hash && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">TX Hash: </span>
                        <span className="font-mono text-foreground">{order.payment_tx_hash.substring(0, 20)}...</span>
                      </div>
                    )}

                    {order.delivery_status === "delivered" && order.delivered_content && (
                      <div className="bg-background p-3 rounded border border-border space-y-2">
                        <div className="flex items-center gap-2 text-green-500">
                          <Download className="h-4 w-4" />
                          <span className="text-sm font-medium">Digital Content Delivered</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-muted p-2 rounded font-mono text-xs text-foreground break-all">
                            {order.delivered_content}
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleCopyContent(order.id, order.delivered_content!)}
                          >
                            {copiedId === order.id ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {order.payment_status === "pending" && (
                      <div className="bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                        <p className="text-xs text-foreground">
                          Waiting for payment confirmation. This may take a few minutes.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
