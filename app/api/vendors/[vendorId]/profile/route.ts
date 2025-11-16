import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const { vendorId } = await params
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, business_name, bio, avatar_url, created_at")
      .eq("id", vendorId)
      .single()

    if (vendorError) throw vendorError

    const { data: reviews } = await supabase.from("vendor_reviews").select("rating").eq("vendor_id", vendorId)

    const reviewCount = reviews?.length || 0
    const averageRating = reviewCount > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount : 0

    return NextResponse.json({
      ...vendor,
      averageRating,
      reviewCount,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
