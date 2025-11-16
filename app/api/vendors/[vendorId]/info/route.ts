import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { FEATURES } from "@/lib/features"

export async function GET(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const { vendorId } = await params

    if (!vendorId || vendorId === "null" || vendorId === "undefined") {
      return NextResponse.json({
        business_name: "Unknown Vendor",
        averageRating: 0,
        reviewCount: 0,
      })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("business_name")
      .eq("id", vendorId)
      .maybeSingle()

    if (vendorError || !vendor) {
      return NextResponse.json({
        business_name: "Unknown Vendor",
        averageRating: 0,
        reviewCount: 0,
      })
    }

    let reviewCount = 0
    let averageRating = 0

    if (FEATURES.VENDOR_REVIEWS_ENABLED) {
      const { data: reviews } = await supabase.from("vendor_reviews").select("rating").eq("vendor_id", vendorId)

      if (reviews && reviews.length > 0) {
        reviewCount = reviews.length
        averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
      }
    }

    return NextResponse.json({
      business_name: vendor.business_name,
      averageRating,
      reviewCount,
    })
  } catch {
    return NextResponse.json({
      business_name: "Unknown Vendor",
      averageRating: 0,
      reviewCount: 0,
    })
  }
}
