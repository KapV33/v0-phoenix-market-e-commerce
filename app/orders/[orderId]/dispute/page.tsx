"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Send, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface Message {
  id: string
  sender_id: string
  sender_type: string
  message: string
  created_at: string
  users?: { username: string }
}

interface Dispute {
  id: string
  reason: string
  status: string
  created_at: string
  order_id: string
  resolution_notes?: string
  orders: {
    product_name: string
    product_price: number
    user_id: string
  }
  escrows: {
    amount: string
    vendor_id: string
    buyer_id: string
  }
}

export default function DisputePage({ params }: { params: { orderId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [creatingDispute, setCreatingDispute] = useState(false)
  const [userRole, setUserRole] = useState<"buyer" | "vendor" | "admin" | null>(null)
  const [buyerPercentage, setBuyerPercentage] = useState(50)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [resolving, setResolving] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchDispute()
    checkUserRole()
  }, [])

  useEffect(() => {
    if (dispute) {
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [dispute])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchDispute = async () => {
    try {
      const response = await fetch(`/api/orders/${params.orderId}/dispute`)
      const data = await response.json()

      if (response.ok && data.dispute) {
        setDispute(data.dispute)
        fetchMessages()
      }
    } catch (error) {
      console.error("Failed to fetch dispute:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!dispute) return

    try {
      const response = await fetch(`/api/disputes/${dispute.id}/messages`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const handleCreateDispute = async () => {
    if (!disputeReason.trim()) {
      alert("Please provide a reason for the dispute")
      return
    }

    setCreatingDispute(true)
    try {
      const response = await fetch(`/api/orders/${params.orderId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason }),
      })

      if (!response.ok) throw new Error("Failed to create dispute")

      fetchDispute()
    } catch (error) {
      alert("Failed to create dispute")
    } finally {
      setCreatingDispute(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !dispute) return

    setSending(true)
    try {
      const response = await fetch(`/api/disputes/${dispute.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      setNewMessage("")
      fetchMessages()
    } catch (error) {
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const checkUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()
      if (data.isAdmin) {
        setUserRole("admin")
      } else if (data.isVendor) {
        setUserRole("vendor")
      } else {
        setUserRole("buyer")
      }
    } catch (error) {
      console.error("Failed to check user role:", error)
    }
  }

  const handleResolveDispute = async () => {
    if (!dispute) return

    const vendorPercentage = 100 - buyerPercentage

    if (!confirm(`Split funds: ${buyerPercentage}% to buyer, ${vendorPercentage}% to vendor. Continue?`)) {
      return
    }

    setResolving(true)
    try {
      const response = await fetch(`/api/disputes/${dispute.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerPercentage,
          vendorPercentage,
          resolutionNotes,
        }),
      })

      if (!response.ok) throw new Error("Failed to resolve dispute")

      alert("Dispute resolved successfully!")
      fetchDispute()
    } catch (error) {
      alert("Failed to resolve dispute")
    } finally {
      setResolving(false)
    }
  }

  const handleBuyerRelease = async () => {
    if (!dispute) return

    if (!confirm("Release 100% of funds to vendor? This action cannot be undone.")) {
      return
    }

    setReleasing(true)
    try {
      const response = await fetch(`/api/disputes/${dispute.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerPercentage: 0,
          vendorPercentage: 100,
          resolutionNotes: "Buyer released funds",
        }),
      })

      if (!response.ok) throw new Error("Failed to release funds")

      alert("Funds released to vendor successfully!")
      fetchDispute()
    } catch (error) {
      alert("Failed to release funds")
    } finally {
      setReleasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold">Open Dispute</h1>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Create Dispute
              </CardTitle>
              <CardDescription>
                Open a dispute if you have an issue with this order. An admin will review and mediate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Dispute Reason *</Label>
                <Textarea
                  id="reason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue with this order..."
                  rows={6}
                  required
                />
              </div>

              <div className="p-4 rounded-lg bg-slate-950 text-card-foreground">
                <p className="text-sm space-y-1 text-ring">
                  <strong>What happens next:</strong>
                  <br />• The vendor and admin will be notified
                  <br />• You can communicate with all parties in the dispute chat
                  <br />• An admin will review and resolve the dispute
                  <br />• The escrow will remain locked until resolution
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDispute}
                  disabled={creatingDispute}
                  variant="destructive"
                  className="flex-1"
                >
                  {creatingDispute ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Open Dispute
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

  const vendorPercentage = 100 - buyerPercentage
  const totalAmount = Number.parseFloat(dispute.escrows?.amount || "0")
  const buyerAmount = (totalAmount * buyerPercentage) / 100
  const vendorAmount = (totalAmount * vendorPercentage) / 100
  const isResolved = dispute.status.startsWith("resolved")

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dispute Resolution</h1>
            <p className="text-muted-foreground">Order: {dispute.orders.product_name}</p>
          </div>
          {getStatusBadge(dispute.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>Buyer, Vendor, and Admin communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea ref={scrollRef} className="h-[500px] pr-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isCurrentUser = msg.sender_type === userRole
                    const senderName =
                      msg.sender_type === "admin"
                        ? "Admin"
                        : msg.sender_type === "vendor"
                          ? "Vendor"
                          : msg.users?.username || "Buyer"

                    return (
                      <div key={msg.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={msg.sender_type === "admin" ? "bg-primary" : ""}>
                            {senderName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${isCurrentUser ? "text-right" : ""}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div
                            className={`inline-block rounded-lg px-4 py-2 ${
                              isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">No messages yet. Start the conversation!</p>
                  )}
                </div>
              </ScrollArea>

              {!isResolved && (
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {isResolved && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-500">Dispute Resolved</p>
                  {dispute.resolution_notes && (
                    <p className="text-xs text-muted-foreground mt-1">{dispute.resolution_notes}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sale Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Product:</p>
                  <p className="text-sm font-medium">{dispute.orders.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Escrow Amount:</p>
                  <p className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Opened:</p>
                  <p className="text-sm">{new Date(dispute.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason:</p>
                  <p className="text-sm bg-muted p-3 rounded">{dispute.reason}</p>
                </div>
              </CardContent>
            </Card>

            {!isResolved && (userRole === "vendor" || userRole === "admin") && (
              <Card className="border-orange-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-orange-500" />
                    Resolve Dispute
                  </CardTitle>
                  <CardDescription>Split funds between buyer and vendor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Fund Distribution</Label>
                      <div className="bg-muted p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Buyer Refund</span>
                          <span className="text-lg font-bold text-blue-500">{buyerPercentage}%</span>
                        </div>
                        <Slider
                          value={[buyerPercentage]}
                          onValueChange={(value) => setBuyerPercentage(value[0])}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Vendor Payout</span>
                          <span className="text-lg font-bold text-green-500">{vendorPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Buyer receives:</span>
                        <span className="font-semibold text-blue-500">${buyerAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vendor receives:</span>
                        <span className="font-semibold text-green-500">${vendorAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Resolution Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Add notes about the resolution..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button onClick={handleResolveDispute} disabled={resolving} className="w-full" size="lg">
                    {resolving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resolving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm Resolution
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isResolved && userRole === "buyer" && (
              <Card className="border-green-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Release Funds
                  </CardTitle>
                  <CardDescription>Close dispute and release payment to vendor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-500/10 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      If you're satisfied with the resolution, you can release the full escrow amount to the vendor.
                    </p>
                  </div>
                  <Button
                    onClick={handleBuyerRelease}
                    disabled={releasing}
                    variant="default"
                    className="w-full"
                    size="lg"
                  >
                    {releasing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Releasing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Release All Funds to Vendor
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className={userRole === "buyer" ? "bg-primary" : ""}>B</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Buyer</p>
                    <p className="text-xs text-muted-foreground">{userRole === "buyer" ? "You" : "Customer"}</p>
                  </div>
                  {userRole === "buyer" && <Badge variant="outline">You</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className={userRole === "vendor" ? "bg-primary" : ""}>V</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Vendor</p>
                    <p className="text-xs text-muted-foreground">{userRole === "vendor" ? "You" : "Seller"}</p>
                  </div>
                  {userRole === "vendor" && <Badge variant="outline">You</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback
                      className={userRole === "admin" ? "bg-primary text-primary-foreground" : "bg-primary"}
                    >
                      A
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Admin</p>
                    <p className="text-xs text-muted-foreground">{userRole === "admin" ? "You" : "Mediator"}</p>
                  </div>
                  {userRole === "admin" && <Badge variant="outline">You</Badge>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
