"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Plus, Search } from "lucide-react"

interface Conversation {
  id: string
  type: string
  subject: string
  status: string
  created_at: string
  updated_at: string
  messages: Array<{ created_at: string }>
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations")
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: "default", label: "Open" },
      closed: { variant: "secondary", label: "Closed" },
      pending: { variant: "default", label: "Pending" },
    }
    const config = variants[status] || { variant: "default", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeIcon = (type: string) => {
    return type === "dispute" ? "Dispute" : "Support"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Your conversations and support tickets</p>
          </div>
          <Button onClick={() => router.push("/support/new")} className="phoenix-gradient">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredConversations.map((conv) => (
            <Card
              key={conv.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/messages/${conv.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{getTypeIcon(conv.type)}</Badge>
                      {getStatusBadge(conv.status)}
                    </div>
                    <CardTitle className="text-lg">{conv.subject}</CardTitle>
                    <CardDescription>
                      {conv.messages.length > 0
                        ? `Last message: ${new Date(conv.messages[0].created_at).toLocaleDateString()}`
                        : "No messages yet"}
                    </CardDescription>
                  </div>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          ))}

          {filteredConversations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground mb-2">No conversations found</p>
                  <Button onClick={() => router.push("/support/new")} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Support Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
