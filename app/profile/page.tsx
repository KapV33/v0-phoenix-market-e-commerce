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

    console.log("[v0] Fetching profile for user:", userId)

    // Fetch user profile
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("[v0] Profile data:", data)
        setProfile(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("[v0] Profile fetch error:", error)
        setIsLoading(false)
      })
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-16 w-16 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-white/70">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-[#2a3142]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/market">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img
              src="/images/photo-2020-07-22-00-13-11-removebg-preview-281-29.png"
              alt="Phoenix Market"
              className="h-8 w-8"
            />
            <h1 className="text-2xl font-bold text-white">Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Profile Info */}
          <Card className="bg-[#2a3142] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
              <CardDescription className="text-gray-400">Your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Username</Label>
                <Input value={profile?.username || ""} disabled className="bg-[#1a1f2e] border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">User ID</Label>
                <Input
                  value={profile?.id || ""}
                  disabled
                  className="font-mono text-xs bg-[#1a1f2e] border-white/10 text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Member Since</Label>
                <Input
                  value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""}
                  disabled
                  className="bg-[#1a1f2e] border-white/10 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Wallet Info */}
          <Card className="bg-[#2a3142] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="h-5 w-5 text-orange-500" />
                Wallet
              </CardTitle>
              <CardDescription className="text-gray-400">Your balance and transaction history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Balance</Label>
                <div className="text-3xl font-bold text-orange-500">${(profile?.wallet_balance || 0).toFixed(2)}</div>
              </div>
              <Link href="/wallet">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Manage Wallet</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Vendor Status */}
          <Card className="bg-[#2a3142] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Store className="h-5 w-5 text-orange-500" />
                Vendor Status
              </CardTitle>
              <CardDescription className="text-gray-400">Become a vendor and start selling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.is_vendor ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Status</Label>
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
                      <span className="capitalize text-white">{profile.vendor_status || "Unknown"}</span>
                    </div>
                  </div>
                  {profile.vendor_status === "approved" && (
                    <Link href="/vendor/dashboard">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                        Go to Vendor Dashboard
                      </Button>
                    </Link>
                  )}
                  {profile.vendor_status === "pending" && (
                    <p className="text-sm text-gray-400">
                      Your application is pending review. You'll be notified once an admin reviews it.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-400">
                    You are not currently a vendor. Start by registering your PGP key, then apply to start selling on
                    Phoenix Market.
                  </p>
                  <Link href="/vendor/pgp-setup">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Start Vendor Application
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-[#2a3142] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/orders">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent border-white/10 text-white hover:bg-white/10"
                >
                  My Orders
                </Button>
              </Link>
              <Link href="/messages">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent border-white/10 text-white hover:bg-white/10"
                >
                  Messages
                </Button>
              </Link>
              <Link href="/support/new">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent border-white/10 text-white hover:bg-white/10"
                >
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
