"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function AuditPage() {
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runAudit = async () => {
    setIsAuditing(true)
    setError(null)
    setAuditResult(null)

    try {
      const response = await fetch('/api/ai/audit', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Audit failed')
      }

      const data = await response.json()
      setAuditResult(data.audit)
    } catch (err: any) {
      setError(err.message || 'Failed to run audit')
    } finally {
      setIsAuditing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="bg-[#162330] border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-2xl">System Audit</CardTitle>
            <CardDescription className="text-white/70">
              Use Grok AI to analyze Phoenix Market for bugs, non-functional features, and production readiness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runAudit} 
              disabled={isAuditing}
              className="phoenix-gradient text-white"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Audit...
                </>
              ) : (
                'Run Complete System Audit'
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {auditResult && (
          <Card className="bg-[#162330] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Audit Results
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ReactMarkdown className="text-white/90 text-sm leading-relaxed">
                {auditResult}
              </ReactMarkdown>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
