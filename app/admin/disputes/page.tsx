"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, AlertTriangle } from "lucide-react"

interface Dispute {
  id: string
  reason: string
  status: string
  created_at: string
  orders: {
    product_name: string
    product_price: number
    id: string
  }
  users: {
    username: string
  }
}

export default function AdminDisputesPage() {
  const router = useRouter()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    try {
      const response = await fetch("/api/admin/disputes")
      const data = await response.json()
      setDisputes(data.disputes || [])
    } catch (error) {
      console.error("Failed to fetch disputes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterByStatus = (status: string) => {
    return disputes.filter((d) => d.status === status)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: "destructive", label: "Open" },
      in_progress: { variant: "default", label: "In Progress" },
      resolved_buyer: { variant: "default", label: "Resolved - Buyer" },
      resolved_vendor: { variant: "default", label: "Resolved - Vendor" },
      resolved_partial: { variant: "secondary", label: "Resolved - Partial" },
    }
    const config = variants[status] || { variant: "default", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Dispute Management</h1>
          <p className="text-muted-foreground">Mediate and resolve buyer-vendor disputes</p>
        </div>

        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({filterByStatus("open").length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({filterByStatus("in_progress").length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            <div className="grid gap-4">
              {filterByStatus("open").map((dispute) => (
                <Card key={dispute.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          {dispute.orders.product_name}
                        </CardTitle>
                        <CardDescription>By: {dispute.users.username}</CardDescription>
                      </div>
                      {getStatusBadge(dispute.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Reason:</p>
                        <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Amount:</p>
                          <p className="font-semibold">${dispute.orders.product_price.toFixed(2)}</p>
                        </div>
                        <Button onClick={() => router.push(`/orders/${dispute.orders.id}/dispute`)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          View & Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filterByStatus("open").length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">No open disputes</CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="in_progress" className="mt-6">
            <div className="grid gap-4">
              {filterByStatus("in_progress").map((dispute) => (
                <Card key={dispute.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{dispute.orders.product_name}</CardTitle>
                        <CardDescription>By: {dispute.users.username}</CardDescription>
                      </div>
                      {getStatusBadge(dispute.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => router.push(`/orders/${dispute.orders.id}/dispute`)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Continue
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            <div className="grid gap-4">
              {disputes
                .filter((d) => d.status.startsWith("resolved"))
                .map((dispute) => (
                  <Card key={dispute.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{dispute.orders.product_name}</CardTitle>
                          <CardDescription>
                            Resolved on {new Date(dispute.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(dispute.status)}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
