"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Flame, ArrowLeft, Wallet, Store } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  username: string
  created_at: string
  wallet_balance?: number
  is_vendor?: boolean
  vendor_status?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
    if (!userId) {
      router.push("/auth/login")
      return
    }

    // Fetch user profile
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-16 w-16 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm text-foreground bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/market">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Flame className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold phoenix-gradient-text">Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={profile?.username || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={profile?.id || ""} disabled className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""} disabled />
              </div>
            </CardContent>
          </Card>

          {/* Wallet Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet
              </CardTitle>
              <CardDescription>Your balance and transaction history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Balance</Label>
                <div className="text-3xl font-bold text-primary">${(profile?.wallet_balance || 0).toFixed(2)}</div>
              </div>
              <Link href="/wallet">
                <Button className="w-full">Manage Wallet</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Vendor Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Vendor Status
              </CardTitle>
              <CardDescription>Become a vendor and start selling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.is_vendor ? (
                <>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          profile.vendor_status === "approved"
                            ? "bg-green-500"
                            : profile.vendor_status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <span className="capitalize">{profile.vendor_status || "Unknown"}</span>
                    </div>
                  </div>
                  {profile.vendor_status === "approved" && (
                    <Link href="/vendor/dashboard">
                      <Button className="w-full">Go to Vendor Dashboard</Button>
                    </Link>
                  )}
                  {profile.vendor_status === "pending" && (
                    <p className="text-sm text-muted-foreground">
                      Your application is pending review. You'll be notified once an admin reviews it.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    You are not currently a vendor. Start by registering your PGP key, then apply to start selling on
                    Phoenix Market.
                  </p>
                  <Link href="/vendor/pgp-setup">
                    <Button className="w-full">Start Vendor Application</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/orders">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  My Orders
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Messages
                </Button>
              </Link>
              <Link href="/support/new">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
