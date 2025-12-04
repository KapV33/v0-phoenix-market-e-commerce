"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, Copy, Check, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
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

interface Order {
  id: string
  order_id: string
  product_id: string
  product_name: string
  vendor_name: string
  amount: number
  status: string
  created_at: string
  auto_finalize_at: string
  delivered_content: string | null
  delivery_status: string
}

function TimeRemaining({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const distance = target - now

      if (distance < 0) {
        setTimeLeft("Auto-finalized")
        return
      }

      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-orange-500" />
      <span className="font-mono">{timeLeft}</span>
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null)
  const [revealedOrders, setRevealedOrders] = useState<Set<string>>(new Set())
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    title: string
    description: string
    variant: "success" | "error"
  }>({
    open: false,
    title: "",
    description: "",
    variant: "success",
  })
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] OrdersPage mounting")
    const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
    if (!userId) {
      router.push("/auth/login")
      return
    }

    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        console.log("[v0] Orders fetched:", data)
        setOrders(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("[v0] Orders fetch error:", error)
        setIsLoading(false)
      })
  }, [router])

  const handleFinalize = async (escrowId: string) => {
    setConfirmDialog({
      open: true,
      title: "Release Payment to Vendor?",
      description: "This will release the escrowed funds to the vendor. This action cannot be undone.",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/orders/release", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ escrowId }),
          })

          const data = await res.json()
          if (data.success) {
            setAlertDialog({
              open: true,
              title: "Payment Released Successfully",
              description: "The funds have been released to the vendor. The order is now complete.",
              variant: "success",
            })
            setTimeout(() => window.location.reload(), 2000)
          } else {
            setAlertDialog({
              open: true,
              title: "Failed to Release Payment",
              description: data.error || "An error occurred while releasing the payment. Please try again.",
              variant: "error",
            })
          }
        } catch (error) {
          setAlertDialog({
            open: true,
            title: "Failed to Release Payment",
            description: "An error occurred while releasing the payment. Please try again.",
            variant: "error",
          })
        }
      },
    })
  }

  const handleDispute = async (escrowId: string, orderId: string) => {
    router.push(`/orders/${orderId}/dispute`)
  }

  const handleCopyContent = (orderId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedOrderId(orderId)
    setTimeout(() => setCopiedOrderId(null), 2000)
  }

  const toggleReveal = (orderId: string) => {
    const newRevealed = new Set(revealedOrders)
    if (newRevealed.has(orderId)) {
      newRevealed.delete(orderId)
    } else {
      newRevealed.add(orderId)
    }
    setRevealedOrders(newRevealed)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "active":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "disputed":
        return "bg-red-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="My Orders" subtitle="Track your purchases and escrow status" showBackButton={true} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No orders yet</p>
              <Link href="/market">
                <Button className="mt-4">Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-2 bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-gray-900">{order.product_name}</CardTitle>
                      <CardDescription className="mt-1 text-gray-600">Vendor: {order.vendor_name}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-lg text-gray-900">${order.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="text-gray-800">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    {order.status === "active" && (
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Auto-finalize in:</span>
                          <TimeRemaining targetDate={order.auto_finalize_at} />
                        </div>
                      </div>
                    )}
                  </div>

                  {order.delivered_content && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">Product Delivered</h3>
                        </div>
                        <Badge className="bg-green-600">
                          {order.delivery_status === "delivered" ? "Ready" : "Processing"}
                        </Badge>
                      </div>

                      <div className="bg-white rounded-md p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Delivery Content:</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleReveal(order.id)}
                              className="h-8 px-3 text-gray-600 hover:text-gray-900"
                            >
                              {revealedOrders.has(order.id) ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Reveal
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyContent(order.id, order.delivered_content!)}
                              className="h-8 px-3 text-gray-600 hover:text-gray-900"
                            >
                              {copiedOrderId === order.id ? (
                                <>
                                  <Check className="h-4 w-4 mr-1 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded border border-gray-200 max-h-60 overflow-y-auto">
                          {revealedOrders.has(order.id) ? order.delivered_content : "••••••••••••••••••••"}
                        </pre>
                      </div>

                      <p className="text-xs text-gray-600 italic">
                        💡 Click "Reveal" to view your product details. Make sure to copy and save this information
                        securely.
                      </p>
                    </div>
                  )}

                  {order.status === "active" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleFinalize(order.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Release Payment
                      </Button>
                      <Button
                        onClick={() => handleDispute(order.id, order.order_id)}
                        variant="destructive"
                        className="flex-1"
                      >
                        Open Dispute
                      </Button>
                    </div>
                  )}

                  {order.status === "completed" && (
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-400">✓ Payment released to vendor</p>
                    </div>
                  )}

                  {order.status === "disputed" && (
                    <div className="space-y-3">
                      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-400">
                          ⚠ Dispute in progress - Admin reviewing
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push(`/orders/${order.order_id}/dispute`)}
                        variant="outline"
                        className="w-full"
                      >
                        View Dispute Chat
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog.onConfirm()
                setConfirmDialog({ ...confirmDialog, open: false })
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              {alertDialog.variant === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              {alertDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setAlertDialog({ ...alertDialog, open: false })}
              className={
                alertDialog.variant === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
