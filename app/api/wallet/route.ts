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

    let { data: wallet, error } = await supabase.from("wallets").select("*").eq("user_id", userId).single()

    if (error && error.code === "PGRST116") {
      // Wallet doesn't exist, create it
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()

      if (createError) throw createError
      wallet = newWallet
    } else if (error) {
      throw error
    }

    return NextResponse.json({ balance: wallet.balance })
  } catch (error: any) {
    console.error("Failed to fetch wallet:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
