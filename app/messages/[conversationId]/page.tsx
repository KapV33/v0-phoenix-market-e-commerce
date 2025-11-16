"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Send, ArrowLeft } from "lucide-react"

interface Message {
  id: string
  sender_id: string
  sender_type: string
  message: string
  created_at: string
  users?: { username: string }
}

interface Conversation {
  id: string
  type: string
  subject: string
  status: string
  created_at: string
}

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversation()
    fetchMessages()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${params.conversationId}`)
      const data = await response.json()
      setConversation(data.conversation)
    } catch (error) {
      console.error("Failed to fetch conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${params.conversationId}/messages`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/conversations/${params.conversationId}/messages`, {
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

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Conversation not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{conversation.subject}</h1>
            <p className="text-sm text-muted-foreground">
              {conversation.type === "dispute" ? "Dispute Chat" : "Support Ticket"}
            </p>
          </div>
          <Badge variant={conversation.status === "open" ? "default" : "secondary"}>{conversation.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Chat with support or relevant parties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea ref={scrollRef} className="h-[500px] pr-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isCurrentUser = msg.sender_type === "user"
                  const senderName =
                    msg.sender_type === "admin"
                      ? "Support"
                      : msg.sender_type === "vendor"
                        ? "Vendor"
                        : msg.users?.username || "You"

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
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div
                          className={`inline-block rounded-lg px-4 py-2 max-w-md ${
                            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
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
      </div>
    </div>
  )
}
