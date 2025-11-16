import { type NextRequest, NextResponse } from "next/server"
import { loginAdmin } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    console.log("[v0] Admin login attempt for username:", username)

    // Validate input
    if (!username || !password) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Login admin
    const result = await loginAdmin({ username, password })

    console.log("[v0] Admin login result:", { success: result.success, error: result.error })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json({ success: true, adminId: result.adminId }, { status: 200 })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
