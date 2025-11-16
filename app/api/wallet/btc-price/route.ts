import { NextResponse } from "next/server"
import { getBTCPrice } from "@/lib/nowpayments"

export async function GET() {
  try {
    const price = await getBTCPrice()
    return NextResponse.json(price)
  } catch (error) {
    console.error("Failed to fetch BTC price:", error)
    return NextResponse.json({ usd: 98500, updated: new Date() })
  }
}
