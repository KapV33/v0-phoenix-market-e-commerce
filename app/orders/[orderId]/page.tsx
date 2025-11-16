"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Clock, CheckCircle, AlertTriangle, MessageSquare } from "lucide-react"

interface Order {
  id: string
  product_name: string
  product_price: number
  payment_status: string
  delivery_status: string
  delivered_content: string | null
  created_at: string
  escrow_status: string
  products: {
    image_url: string | null
    product_type: string
  }
  escrows: {
    id: string
    status: string
    auto_finalize_at: string
    extended_count: number
    vendor_amount: number
    commission_amount: number
  }
}

export default function OrderPage({ params }: { params: { orderId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [])

  useEffect(() => {
    if (!order?.escrows) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const finalize = new Date(order.escrows.auto_finalize_at).getTime()
      const diff = finalize - now

      if (diff <= 0) {
        setTimeRemaining("Auto-finalizing...")
        fetchOrder()
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [order])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.orderId}`)
      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error("Failed to fetch order:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (!confirm("Are you sure you want to finalize this order? Funds will be released to the vendor.")) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/orders/${params.orderId}/finalize`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to finalize order")

      alert("Order finalized successfully!")
      fetchOrder()
    } catch (error) {
      alert("Failed to finalize order")
    } finally {
      setProcessing(false)
    }
  }

  const handleExtend = async () => {
    if (!order?.escrows || order.escrows.extended_count >= 5) {
      alert("Maximum extensions reached")
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/orders/${params.orderId}/extend`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to extend escrow")

      alert("Escrow extended by 2 days!")
      fetchOrder()
    } catch (error) {
      alert("Failed to extend escrow")
    } finally {
      setProcessing(false)
    }
  }

  const handleDispute = () => {
    router.push(`/orders/${params.orderId}/dispute`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: "default", label: "In Escrow" },
      disputed: { variant: "destructive", label: "Disputed" },
      released: { variant: "default", label: "Completed" },
      refunded: { variant: "secondary", label: "Refunded" },
    }
    const config = variants[status] || { variant: "default", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>
          {order.escrows && getStatusBadge(order.escrows.status)}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{order.product_name}</CardTitle>
            <CardDescription>Purchased on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <img
                src={order.products.image_url || "/placeholder.svg"}
                alt={order.product_name}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-semibold">${order.product_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product Type:</span>
                  <Badge variant="secondary">
                    {order.products.product_type === "digital" ? "Digital" : "Physical"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge>{order.payment_status}</Badge>
                </div>
              </div>
            </div>

            {order.delivered_content && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Digital Content:</p>
                  <p className="text-sm">{order.delivered_content}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {order.escrows && order.escrows.status === "active" && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Escrow Timer
              </CardTitle>
              <CardDescription>Time remaining until auto-finalization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-bold phoenix-gradient-text mb-2">{timeRemaining}</p>
                <p className="text-sm text-muted-foreground">
                  Auto-finalizes at {new Date(order.escrows.auto_finalize_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Extensions used:</span>
                  <span className="font-medium">{order.escrows.extended_count}/5</span>
                </div>
                <Progress value={(order.escrows.extended_count / 5) * 100} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleFinalize} disabled={processing} className="phoenix-gradient">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalize Sale
                </Button>
                <Button
                  onClick={handleExtend}
                  disabled={processing || order.escrows.extended_count >= 5}
                  variant="outline"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Extend (+2 days)
                </Button>
                <Button onClick={handleDispute} disabled={processing} variant="destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Open Dispute
                </Button>
              </div>

              <Alert>
                <AlertDescription className="text-sm space-y-1">
                  <p>• Click "Finalize Sale" when satisfied with your purchase</p>
                  <p>• Use "Extend" if you need more time to review (max 5 extensions)</p>
                  <p>• Open a dispute if there's an issue with the product</p>
                  <p>• Funds are held securely and will not be released without your approval or auto-finalization</p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {order.escrows && order.escrows.status === "released" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-2xl font-bold">Order Completed</h3>
              <p className="text-muted-foreground">
                This order has been finalized. Funds have been released to the vendor.
              </p>
            </CardContent>
          </Card>
        )}

        {order.escrows && order.escrows.status === "disputed" && (
          <Card className="border-destructive/50">
            <CardContent className="py-12 text-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
              <h3 className="text-2xl font-bold">Dispute In Progress</h3>
              <p className="text-muted-foreground">This order is currently under dispute review.</p>
              <Button onClick={() => router.push(`/orders/${params.orderId}/dispute`)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                View Dispute
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
