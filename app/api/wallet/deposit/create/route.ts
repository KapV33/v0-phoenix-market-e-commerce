import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createPaymentInvoice, getMinimumPaymentAmount } from "@/lib/nowpayments"

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

    const minAmount = await getMinimumPaymentAmount()
    if (amountUSD < minAmount) {
      return NextResponse.json({ error: `Minimum deposit amount is $${minAmount}` }, { status: 400 })
    }

    const invoice = await createPaymentInvoice(userId, amountUSD)

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      orderId: invoice.order_id,
      amountUSD: amountUSD,
      payCurrency: invoice.pay_currency,
    })
  } catch (error: any) {
    console.error("Failed to create deposit invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
