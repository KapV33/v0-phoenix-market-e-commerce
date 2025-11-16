import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createDepositInvoice } from "@/lib/nowpayments"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("phoenix_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { amountUSD } = await request.json()

    if (!amountUSD || amountUSD <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Create deposit invoice
    const invoice = await createDepositInvoice(userId, amountUSD)

    return NextResponse.json({
      success: true,
      invoiceId: invoice.invoiceId,
      btcAddress: invoice.btcAddress,
      btcAmount: invoice.btcAmount,
      amountUSD,
    })
  } catch (error: any) {
    console.error("Failed to create deposit invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
