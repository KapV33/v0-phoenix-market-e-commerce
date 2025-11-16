"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Captcha } from "@/components/captcha"
import Image from "next/image"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [pin, setPin] = useState("")
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!captchaVerified) {
      setError("Please complete the captcha")
      return
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Store user session
      document.cookie = `phoenix_user_id=${data.userId}; path=/; max-age=86400`
      router.push("/market")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f1419]">
      <div className="w-full max-w-md">
        

        <Card className="border border-white/10 bg-card shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3 justify-center mb-2">
              <Image 
                src="/images/design-mode/photo_2020-07-22_00-13-11-removebg-preview%281%29.png"
                alt="Phoenix Market Logo"
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
              />
              <CardTitle className="text-4xl font-bold phoenix-logo-text-gradient">Phoenix Market</CardTitle>
            </div>
            <CardDescription className="text-accent text-center">Login to access the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-[#1a2332] border-accent/30 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#1a2332] border-accent/30 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-white">
                  6-Digit PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  className="bg-[#1a2332] border-accent/30 text-white placeholder:text-gray-400 font-mono tracking-widest"
                />
              </div>

              <Captcha onVerify={setCaptchaVerified} />

              {error && (
                <div className="p-3 bg-destructive/20 border border-destructive rounded-lg">
                  <p className="text-sm text-destructive-foreground">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full phoenix-gradient-animated phoenix-glow text-white font-semibold hover:opacity-90 transition-all shadow-lg"
                disabled={isLoading || !captchaVerified}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center text-sm text-white/70">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="phoenix-gradient-text hover:opacity-80 font-medium">
                  Register
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
