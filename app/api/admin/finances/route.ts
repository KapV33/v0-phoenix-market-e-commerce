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

    // Get commission settings
    const { data: commissionData } = await supabase
      .from("commission_settings")
      .select("commission_percentage")
      .eq("setting_type", "global")
      .single()

    // Calculate stats
    const { data: escrows } = await supabase.from("escrows").select("amount, commission_amount, status")

    const totalRevenue = escrows?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
    const totalCommissions = escrows?.reduce((sum, e) => sum + Number(e.commission_amount || 0), 0) || 0
    const totalEscrow =
      escrows?.filter((e) => e.status === "holding").reduce((sum, e) => sum + Number(e.amount), 0) || 0

    return NextResponse.json({
      commissionRate: commissionData?.commission_percentage || 10,
      stats: {
        totalRevenue,
        totalCommissions,
        totalEscrow,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to load finance data" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const adminId = cookieStore.get("phoenix_admin_id")?.value

    if (!adminId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { commissionRate } = await request.json()

    // Update or insert commission settings
    const { error } = await supabase.from("commission_settings").upsert({
      setting_type: "global",
      commission_percentage: commissionRate,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update commission rate" }, { status: 500 })
  }
}
