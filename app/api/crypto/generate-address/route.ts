import { type NextRequest, NextResponse } from "next/server"
import { generatePaymentAddress } from "@/lib/crypto-payment"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currency } = body

    const paymentAddress = generatePaymentAddress(currency)

    return NextResponse.json(paymentAddress)
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate payment address" }, { status: 500 })
  }
}
