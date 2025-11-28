"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, ArrowLeft, CheckCircle, Clock, Download, Copy, AlertTriangle, Timer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Order {
  id: string
  product_name: string
  product_price: number
  payment_status: string
  delivery_status: string
  delivered_content: string | null
  payment_tx_hash: string | null
  created_at: string
  escrow_status: string | null
  escrow?: {
    id: string
    status: string
    auto_finalize_at: string
    amount: number
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState("")
  const [releaseOrderId, setReleaseOrderId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
    if (!userId) {
      router.push("/auth/login")
      return
    }

    fetchOrders(userId)
    const interval = setInterval(() => fetchOrders(userId), 30000)
    return () => clearInterval(interval)
  }, [router])

  const fetchOrders = async (userId: string) => {
    try {
      const res = await fetch(`/api/marketplace/orders?userId=${userId}`)
      const data = await res.json()
      setOrders(data)
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Failed to fetch orders:", error)
      setIsLoading(false)
    }
  }

  const handleCopyContent = (orderId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(orderId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReleaseFunds = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      if (res.ok) {
        setReleaseOrderId(null)
        const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
        if (userId) fetchOrders(userId)
      } else {
        alert("Failed to release funds")
      }
    } catch (error) {
      alert("Error releasing funds")
    }
  }

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      alert("Please provide a reason for the dispute")
      return
    }

    try {
      const res = await fetch("/api/orders/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: disputeOrderId, reason: disputeReason }),
      })

      if (res.ok) {
        setDisputeOrderId(null)
        setDisputeReason("")
        const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
        if (userId) fetchOrders(userId)
      } else {
        alert("Failed to open dispute")
      }
    } catch (error) {
      alert("Error opening dispute")
    }
  }

  const getTimeRemaining = (autoFinalizeAt: string) => {
    const now = new Date().getTime()
    const finalizeTime = new Date(autoFinalizeAt).getTime()
    const diff = finalizeTime - now

    if (diff <= 0) return "Finalizing..."

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm text-sidebar-primary bg-popover-foreground">
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
                <p className="text-muted">No orders yet</p>
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

                    <div className="flex gap-4 text-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        {order.payment_status === "completed" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-muted-foreground">
                          Payment: <span className="capitalize text-foreground">{order.payment_status}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {order.delivery_status === "delivered" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-muted-foreground">
                          Delivery: <span className="capitalize text-foreground">{order.delivery_status}</span>
                        </span>
                      </div>
                    </div>

                    {order.escrow && order.escrow.status === "active" && (
                      <div className="bg-blue-500/10 p-3 rounded border border-blue-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-500">
                            <Timer className="h-4 w-4" />
                            <span className="text-sm font-medium">Funds in Escrow</span>
                          </div>
                          <span className="text-xs text-foreground">
                            Auto-finalize in: {getTimeRemaining(order.escrow.auto_finalize_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${order.escrow.amount.toFixed(2)} is held securely until you release or dispute the order.
                        </p>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setReleaseOrderId(order.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Release Funds
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => setDisputeOrderId(order.id)}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Dispute
                          </Button>
                        </div>
                      </div>
                    )}

                    {order.escrow && order.escrow.status === "disputed" && (
                      <div className="bg-red-500/10 p-3 rounded border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Dispute Opened</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          An admin is reviewing your dispute. You'll be notified of the resolution.
                        </p>
                      </div>
                    )}

                    {order.escrow && order.escrow.status === "finalized" && (
                      <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Order Completed</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Funds have been released to the vendor.</p>
                      </div>
                    )}

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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!releaseOrderId} onOpenChange={() => setReleaseOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Funds to Vendor</DialogTitle>
            <DialogDescription>
              Are you satisfied with your order? This will release the funds from escrow to the vendor. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseOrderId(null)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleReleaseFunds(releaseOrderId!)}>
              Confirm Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!disputeOrderId} onOpenChange={() => setDisputeOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open a Dispute</DialogTitle>
            <DialogDescription>
              Explain the issue with your order. An admin will review your case and mediate between you and the vendor.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the problem with your order..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
            className="my-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOrderId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDispute}>
              Open Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
