"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runSetup = async (force = false) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const url = force ? "/api/setup?force=true" : "/api/setup"
      const response = await fetch(url, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Setup failed")
      } else {
        setResult(data)
      }
    } catch (err) {
      setError("Failed to connect to setup endpoint")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <CardTitle className="text-2xl text-white">Phoenix Market Setup</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Initialize your Phoenix Market with admin and user accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result && !error && (
            <div className="space-y-4">
              <p className="text-gray-300">
                Click the button below to create or reset the admin and user accounts for Phoenix Market.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => runSetup(false)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Run Setup"
                  )}
                </Button>
                <Button
                  onClick={() => runSetup(true)}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-orange-600 text-orange-500 hover:bg-orange-950/50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset Passwords
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Use "Reset Passwords" if you're having login issues with existing accounts.
              </p>
            </div>
          )}

          {error && (
            <Alert className="bg-red-950/50 border-red-900">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert className="bg-green-950/50 border-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-300">{result.message}</AlertDescription>
              </Alert>

              <div className="space-y-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]">
                <h3 className="text-lg font-semibold text-white">Admin Credentials</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-500">Username:</span>{" "}
                    <span className="font-mono text-white">{result.credentials.admin.username}</span>
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Password:</span>{" "}
                    <span className="font-mono text-white">{result.credentials.admin.password}</span>
                  </p>
                  <Link href={result.credentials.admin.loginUrl}>
                    <Button className="mt-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                      Go to Admin Login
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]">
                <h3 className="text-lg font-semibold text-white">User Credentials</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-500">Username:</span>{" "}
                    <span className="font-mono text-white">{result.credentials.user.username}</span>
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Password:</span>{" "}
                    <span className="font-mono text-white">{result.credentials.user.password}</span>
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">PIN:</span>{" "}
                    <span className="font-mono text-white">{result.credentials.user.pin}</span>
                  </p>
                  <Link href={result.credentials.user.loginUrl}>
                    <Button className="mt-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                      Go to User Login
                    </Button>
                  </Link>
                </div>
              </div>

              <Alert className="bg-yellow-950/50 border-yellow-900">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-300">
                  For security, consider removing or disabling the /api/setup endpoint after initial setup.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => {
                  setResult(null)
                  setError(null)
                }}
                variant="outline"
                className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                Run Setup Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
