"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function MigratePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const runMigrations = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Database Migration
          </CardTitle>
          <CardDescription className="text-center text-neutral-400">
            Run pending database migrations to update the schema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-neutral-300 space-y-2">
            <p>This will apply the following changes:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Add subcategory support to categories table</li>
              <li>Create necessary indexes and constraints</li>
            </ul>
          </div>

          <Button
            onClick={runMigrations}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Migrations...
              </>
            ) : (
              "Run Migrations"
            )}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.success
                  ? "bg-green-500/10 border-green-500/50 text-green-400"
                  : "bg-red-500/10 border-red-500/50 text-red-400"
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{result.success ? "Success!" : "Error"}</p>
                  <p className="text-sm mt-1">{result.message || result.error}</p>
                  {result.success && (
                    <p className="text-sm mt-2 text-neutral-400">
                      You can now close this page and return to the admin dashboard.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
