import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", userId).maybeSingle()

    if (!wallet) {
      return NextResponse.json({ transactions: [] })
    }

    const { data: transactions, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ transactions })
  } catch (error: any) {
    console.error("Failed to fetch transactions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
