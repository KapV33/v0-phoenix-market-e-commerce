import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    // Skip header row
    const dataLines = lines.slice(1)

    const cards = []
    for (const line of dataLines) {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))

      if (values.length < 10) continue

      cards.push({
        vendor_id: vendor.id,
        bin: values[0],
        country: values[1],
        base_seller: values[2],
        name: values[3],
        city: values[4],
        state: values[5],
        zip: values[6],
        fullz: values[7],
        price: Number.parseFloat(values[8]) || 0,
        full_card_data: values[9],
      })
    }

    if (cards.length === 0) {
      return NextResponse.json({ error: "No valid cards found in file" }, { status: 400 })
    }

    const { error } = await supabase.from("cards").insert(cards)

    if (error) {
      console.error("[v0] Error inserting cards:", error)
      return NextResponse.json({ error: "Failed to upload cards" }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: cards.length })
  } catch (error) {
    console.error("[v0] Card upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
