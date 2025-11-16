"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Eye, AlertCircle } from "lucide-react"

interface Vendor {
  id: string
  business_name: string
  bio: string | null
  pgp_public_key: string
  status: string
  applied_at: string
  users: { username: string }
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/admin/vendors")
      const data = await response.json()
      setVendors(data.vendors || [])
    } catch (err) {
      console.error("Failed to fetch vendors:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (vendorId: string, approved: boolean) => {
    setActionLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/vendors/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ vendorId, approved }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to process approval")
      }

      fetchVendors()
      setSelectedVendor(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const filterByStatus = (status: string) => {
    return vendors.filter((v) => v.status === status)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 p-6 bg-secondary rounded-lg text-white">
          <h1 className="text-4xl font-bold">Vendor Management</h1>
          <p className="text-white/70">Review and approve vendor applications</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({filterByStatus("pending").length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({filterByStatus("approved").length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({filterByStatus("rejected").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4">
              {filterByStatus("pending").map((vendor) => (
                <Card key={vendor.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{vendor.business_name}</CardTitle>
                        <CardDescription>Applied by: {vendor.users.username}</CardDescription>
                      </div>
                      {getStatusBadge(vendor.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {vendor.bio && (
                        <div>
                          <p className="text-sm font-medium mb-1">Bio:</p>
                          <p className="text-sm text-muted-foreground">{vendor.bio}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedVendor(vendor)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproval(vendor.id, true)}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleApproval(vendor.id, false)}
                          disabled={actionLoading}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filterByStatus("pending").length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">No pending applications</CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <div className="grid gap-4">
              {filterByStatus("approved").map((vendor) => (
                <Card key={vendor.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{vendor.business_name}</CardTitle>
                        <CardDescription>Vendor: {vendor.users.username}</CardDescription>
                      </div>
                      {getStatusBadge(vendor.status)}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <div className="grid gap-4">
              {filterByStatus("rejected").map((vendor) => (
                <Card key={vendor.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{vendor.business_name}</CardTitle>
                        <CardDescription>User: {vendor.users.username}</CardDescription>
                      </div>
                      {getStatusBadge(vendor.status)}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedVendor?.business_name}</DialogTitle>
              <DialogDescription>Vendor Application Details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Username:</p>
                <p className="text-sm text-muted-foreground">{selectedVendor?.users.username}</p>
              </div>
              {selectedVendor?.bio && (
                <div>
                  <p className="text-sm font-medium mb-1">Bio:</p>
                  <p className="text-sm text-muted-foreground">{selectedVendor.bio}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-1">PGP Public Key:</p>
                <Textarea
                  value={selectedVendor?.pgp_public_key || ""}
                  readOnly
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
