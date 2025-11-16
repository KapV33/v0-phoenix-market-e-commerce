import { type NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/lib/crypto-payment"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { txHash } = body

    if (!txHash) {
      return NextResponse.json({ error: "Transaction hash required" }, { status: 400 })
    }

    const isValid = await verifyPayment(txHash)

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
