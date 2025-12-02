import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const RATE_LIMITS = {
  "/api/auth/login": { maxRequests: 5, windowMinutes: 15 },
  "/api/auth/register": { maxRequests: 3, windowMinutes: 60 },
  "/api/orders/create": { maxRequests: 10, windowMinutes: 5 },
  "/api/wallet/deposit/create": { maxRequests: 5, windowMinutes: 10 },
  default: { maxRequests: 100, windowMinutes: 1 },
}

export async function checkRateLimit(request: NextRequest, endpoint: string) {
  const identifier = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  const config = (RATE_LIMITS as any)[endpoint] || RATE_LIMITS.default

  try {
    const supabase = await createServerClient()
    const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000)

    // Check existing rate limit
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("count")
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart.toISOString())
      .single()

    if (existing && existing.count >= config.maxRequests) {
      return { limited: true, remainingRequests: 0 }
    }

    // Increment or create rate limit entry
    if (existing) {
      await supabase
        .from("rate_limits")
        .update({ count: existing.count + 1 })
        .eq("identifier", identifier)
        .eq("endpoint", endpoint)
    } else {
      await supabase.from("rate_limits").insert({
        identifier,
        endpoint,
        count: 1,
        window_start: new Date().toISOString(),
      })
    }

    const remaining = config.maxRequests - (existing?.count || 0) - 1
    return { limited: false, remainingRequests: Math.max(0, remaining) }
  } catch (error) {
    console.error("[v0] Rate limit check failed:", error)
    return { limited: false, remainingRequests: 100 }
  }
}
