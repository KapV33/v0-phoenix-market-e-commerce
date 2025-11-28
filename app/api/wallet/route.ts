import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server component - ignore
          }
        },
      },
    })

    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] Fetching wallet for user:", userId)

    const { data: wallet, error } = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle()

    if (error) {
      console.log("[v0] Wallet query error:", error)
      return NextResponse.json({ balance: 0 }, { status: 200 })
    }

    if (!wallet) {
      console.log("[v0] Creating new wallet for user:", userId)
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Failed to create wallet:", createError)
        return NextResponse.json({ balance: 0 }, { status: 200 })
      }

      console.log("[v0] New wallet created:", newWallet)
      return NextResponse.json({ balance: newWallet?.balance || 0 })
    }

    console.log("[v0] Wallet found:", wallet)
    return NextResponse.json({ balance: wallet?.balance || 0 })
  } catch (error: any) {
    console.error("[v0] Failed to fetch wallet:", error)
    return NextResponse.json({ balance: 0 }, { status: 200 })
  }
}
