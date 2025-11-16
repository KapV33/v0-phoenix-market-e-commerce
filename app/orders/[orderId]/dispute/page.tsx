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
import { Loader2, Send, AlertTriangle } from "lucide-react"

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
  orders: {
    product_name: string
    product_price: number
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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchDispute()
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

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground space-y-1">
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dispute Chat</h1>
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
                    const isCurrentUser = msg.sender_type === "user"
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
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Opened:</p>
                  <p className="text-sm">{new Date(dispute.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount:</p>
                  <p className="text-lg font-semibold">${dispute.orders.product_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason:</p>
                  <p className="text-sm">{dispute.reason}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>B</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Buyer</p>
                    <p className="text-xs text-muted-foreground">You</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>V</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Vendor</p>
                    <p className="text-xs text-muted-foreground">Seller</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary">A</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-xs text-muted-foreground">Mediator</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
