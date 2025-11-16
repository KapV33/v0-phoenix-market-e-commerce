"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, HelpCircle } from "lucide-react"

interface Ticket {
  id: string
  subject: string
  status: string
  created_at: string
  updated_at: string
  users: {
    username: string
    email: string
  }
  messages: Array<{ created_at: string }>
}

export default function AdminSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/admin/support")
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterByStatus = (status: string) => {
    return tickets.filter((t) => t.status === status)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage customer support requests</p>
        </div>

        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({filterByStatus("open").length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({filterByStatus("pending").length})</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            <div className="grid gap-4">
              {filterByStatus("open").map((ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <HelpCircle className="h-5 w-5" />
                          {ticket.subject}
                        </CardTitle>
                        <CardDescription>
                          From: {ticket.users.username} ({ticket.users.email})
                        </CardDescription>
                      </div>
                      <Badge>Open</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(ticket.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Messages: {ticket.messages.length}</p>
                      </div>
                      <Button onClick={() => router.push(`/messages/${ticket.id}`)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View & Respond
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filterByStatus("open").length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">No open tickets</CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4">
              {filterByStatus("pending").map((ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{ticket.subject}</CardTitle>
                        <CardDescription>From: {ticket.users.username}</CardDescription>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => router.push(`/messages/${ticket.id}`)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Continue
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="closed" className="mt-6">
            <div className="grid gap-4">
              {filterByStatus("closed").map((ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{ticket.subject}</CardTitle>
                        <CardDescription>Closed on {new Date(ticket.updated_at).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant="secondary">Closed</Badge>
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
