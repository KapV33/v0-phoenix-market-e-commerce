import { streamText } from "ai"
import { xai } from "@ai-sdk/xai"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 })
    }

    // Use phnx_XAI_API_KEY if XAI_API_KEY is not available
    const apiKey = process.env.XAI_API_KEY || process.env.phnx_XAI_API_KEY

    if (!apiKey) {
      return new Response("XAI API key not configured", { status: 500 })
    }

    const result = streamText({
      model: xai("grok-beta", {
        apiKey: apiKey,
      }),
      prompt: prompt,
      system:
        "You are Grok, a helpful AI assistant for Phoenix Market. Provide accurate and engaging responses about the marketplace.",
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Error generating text with Grok:", error)
    return new Response("Failed to generate response", { status: 500 })
  }
}
