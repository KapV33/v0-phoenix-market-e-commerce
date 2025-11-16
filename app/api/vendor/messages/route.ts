import { type NextRequest, NextResponse } from "next/server"
import { getVendorAuthClient } from "@/lib/vendor-auth"

export async function GET(request: NextRequest) {
  try {
    const { client, userId, error } = await getVendorAuthClient()

    if (error || !userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ messages: [] })
  } catch (error: any) {
    console.error("[v0] Failed to fetch messages:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
