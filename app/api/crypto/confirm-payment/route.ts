import { type NextRequest, NextResponse } from "next/server"
import { confirmPayment } from "@/lib/crypto-payment"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, txHash } = body

    if (!orderId || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await confirmPayment(orderId, txHash)

    if (!success) {
      return NextResponse.json({ error: "Payment confirmation failed" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}
