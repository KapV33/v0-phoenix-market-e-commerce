import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.cookies.get("phoenix_user_id")?.value
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", userId).single()

    if (!vendor) {
      return NextResponse.json({ error: "Not a vendor" }, { status: 403 })
    }

    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("id", params.id)
      .eq("vendor_id", vendor.id)
      .eq("is_sold", false)

    if (error) {
      console.error("[v0] Error deleting card:", error)
      return NextResponse.json({ error: "Failed to delete card" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Card delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
