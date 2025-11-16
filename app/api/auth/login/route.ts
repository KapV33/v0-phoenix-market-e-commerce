import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, pin } = body

    console.log("[v0] User login attempt for username:", username)

    // Validate input
    if (!username || !password || !pin) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      console.log("[v0] Invalid PIN format")
      return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 })
    }

    // Login user
    const result = await loginUser({ username, password, pin })

    console.log("[v0] User login result:", { success: result.success, error: result.error })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    const supabase = await createServerClient()
    const response = NextResponse.json({ success: true, userId: result.userId }, { status: 200 })

    // Store user ID in a cookie for session management
    response.cookies.set("user_session", result.userId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("[v0] Cookie set for user:", result.userId)

    return response
  } catch (error) {
    console.error("[v0] User login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
