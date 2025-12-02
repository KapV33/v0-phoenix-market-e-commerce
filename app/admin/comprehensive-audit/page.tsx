"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Shield, Zap } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

export default function ComprehensiveAuditPage() {
  const [audit, setAudit] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const runAudit = async () => {
    setLoading(true)
    setError("")
    setAudit("")

    try {
      const res = await fetch("/api/ai/comprehensive-audit", {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error(`Audit failed: ${res.statusText}`)
      }

      const data = await res.json()
      setAudit(data.audit)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <PageHeader title="Comprehensive Security & QA Audit" />

      <div className="container mx-auto px-4 py-8">
        <Card className="bg-[#2a3142] border-[#3a4152] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-orange-500" />
              AI-Powered Production Readiness Audit
            </CardTitle>
            <CardDescription className="text-gray-400">
              Comprehensive security, functionality, and UX analysis powered by Grok AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-[#1a1f2e] border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-orange-500">
                    <AlertTriangle className="h-4 w-4" />
                    Security Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400">SQL injection, XSS, auth bypass, RLS policies, API security</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1f2e] border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-500">
                    <Zap className="h-4 w-4" />
                    Functionality Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400">Buttons, forms, navigation, API endpoints, database queries</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1f2e] border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    UI/UX Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400">Contrast, responsiveness, accessibility, consistency</p>
                </CardContent>
              </Card>
            </div>

            <Button onClick={runAudit} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? "Running Comprehensive Audit..." : "Start Full System Audit"}
            </Button>

            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {audit && (
              <Card className="bg-[#1a1f2e] border-[#3a4152]">
                <CardHeader>
                  <CardTitle className="text-white">Audit Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">{audit}</pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
