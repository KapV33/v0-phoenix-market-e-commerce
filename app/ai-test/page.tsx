"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AITestPage() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse("")

    try {
      const res = await fetch("/api/ai/grok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        setResponse(`Error: ${errorText}`)
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk
          setResponse(accumulatedText)
        }
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : "Failed to get response"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Grok AI Integration Test</CardTitle>
            <CardDescription>
              Test the Grok AI connection for Phoenix Market
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Grok anything..."
                className="min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="w-full phoenix-gradient"
            >
              {loading ? "Generating..." : "Ask Grok"}
            </Button>

            {response && (
              <div>
                <label className="block text-sm font-medium mb-2">Response</label>
                <div className="p-4 bg-gray-50 rounded-lg border whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
