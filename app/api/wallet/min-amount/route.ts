import { NextResponse } from "next/server"
import { getMinimumPaymentAmount } from "@/lib/nowpayments"

export async function GET() {
  try {
    const minAmount = await getMinimumPaymentAmount()
    return NextResponse.json({ minAmount })
  } catch (error) {
    return NextResponse.json({ minAmount: 10 })
  }
}
