import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { FEATURES } from "@/lib/features"

export async function GET(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  if (!FEATURES.VENDOR_REVIEWS_ENABLED) {
    return NextResponse.json([])
  }

  try {
    const { vendorId } = await params
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: reviews, error } = await supabase
      .from("vendor_reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })

    if (error) {
      console.log("[v0] Reviews table not available, returning empty array:", error.message)
      return NextResponse.json([])
    }

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const { data: user } = await supabase.from("users").select("username").eq("id", review.user_id).single()

        return {
          ...review,
          user: { username: user?.username || "Anonymous" },
        }
      }),
    )

    return NextResponse.json(reviewsWithUsers)
  } catch (error: any) {
    console.log("[v0] Reviews API error:", error.message)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  if (!FEATURES.VENDOR_REVIEWS_ENABLED) {
    return NextResponse.json({ error: "Reviews feature not yet available" }, { status: 503 })
  }

  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { vendorId } = await params
    const { orderId, rating, comment } = await request.json()

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, vendor_id")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.vendor_id !== vendorId) {
      return NextResponse.json({ error: "Order does not belong to this vendor" }, { status: 400 })
    }

    const { data: review, error: reviewError } = await supabase
      .from("vendor_reviews")
      .upsert({
        vendor_id: vendorId,
        user_id: userId,
        order_id: orderId,
        rating,
        comment,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (reviewError) throw reviewError

    return NextResponse.json({ success: true, review })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
