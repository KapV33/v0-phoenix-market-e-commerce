import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminId = cookieStore.get("phoenix_admin_id")?.value

    if (!adminId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get all wallets with user information
    const { data: wallets, error } = await supabase
      .from("wallets")
      .select(`
        *,
        users!inner(username)
      `)
      .order("balance", { ascending: false })

    if (error) throw error

    const walletsWithUsernames = wallets?.map((wallet) => ({
      ...wallet,
      username: wallet.users?.username || "Unknown",
    }))

    return NextResponse.json(walletsWithUsernames || [])
  } catch (error) {
    return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 })
  }
}
