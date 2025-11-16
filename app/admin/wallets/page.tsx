"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Wallet, Search, User, TrendingUp } from "lucide-react"

interface WalletData {
  id: string
  user_id: string
  username: string
  balance: number
  created_at: string
  updated_at: string
}

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      const response = await fetch("/api/admin/wallets")
      if (!response.ok) throw new Error("Failed to load wallets")

      const data = await response.json()
      setWallets(data)
    } catch (error) {
      console.error("Failed to load wallets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWallets = wallets.filter(
    (wallet) =>
      wallet.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.user_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading wallet data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Wallet Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{wallets.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold phoenix-gradient-text">${totalBalance.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{wallets.filter((w) => w.balance > 0).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallets List */}
        <div className="grid gap-4">
          {filteredWallets.map((wallet) => (
            <Card key={wallet.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{wallet.username || "Unknown User"}</h3>
                      <p className="text-sm text-muted-foreground">ID: {wallet.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold phoenix-gradient-text">${wallet.balance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(wallet.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredWallets.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No wallets found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
