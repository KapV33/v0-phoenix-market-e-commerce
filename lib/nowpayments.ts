// NOWPayments API integration for crypto payments
// Official API documentation: https://documenter.getpostman.com/view/7907941/2s93JusNJt

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1"

if (!NOWPAYMENTS_API_KEY) {
  throw new Error("NOWPAYMENTS_API_KEY environment variable is not set")
}

export interface NOWPaymentsInvoice {
  id: string
  token_id: string
  order_id: string
  order_description: string
  price_amount: string
  price_currency: string
  pay_currency: string
  ipn_callback_url: string
  invoice_url: string
  success_url: string
  cancel_url: string
  created_at: string
  updated_at: string
}

export interface PaymentStatus {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  created_at: string
  updated_at: string
}

export async function getAvailableCurrencies(): Promise<string[]> {
  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY!,
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch currencies from NOWPayments")
      return ["btc"] // Default to BTC
    }

    const data = await response.json()
    return data.currencies || ["btc"]
  } catch (error) {
    console.error("Error fetching NOWPayments currencies:", error)
    return ["btc"]
  }
}

export async function createPaymentInvoice(
  userId: string,
  amountUSD: number,
  orderId?: string,
): Promise<NOWPaymentsInvoice> {
  try {
    const invoiceOrderId = orderId || `deposit_${userId}_${Date.now()}`

    const requestBody = {
      price_amount: amountUSD,
      price_currency: "usd",
      pay_currency: "btc", // Only accept Bitcoin
      order_id: invoiceOrderId,
      order_description: `Wallet deposit for user ${userId}`,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://phoenix-market.vercel.app"}/api/wallet/ipn`,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://phoenix-market.vercel.app"}/wallet?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://phoenix-market.vercel.app"}/wallet?status=cancelled`,
      is_fixed_rate: true,
      is_fee_paid_by_user: false, // Merchant pays the fees
    }

    console.log("[v0] Creating NOWPayments invoice:", requestBody)

    const response = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("NOWPayments API error:", errorText)
      throw new Error(`NOWPayments API error: ${response.status} - ${errorText}`)
    }

    const invoice = await response.json()
    console.log("[v0] NOWPayments invoice created:", invoice.id)

    return invoice
  } catch (error) {
    console.error("Failed to create NOWPayments invoice:", error)
    throw error
  }
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get payment status: ${response.status}`)
    }

    const status = await response.json()
    return status
  } catch (error) {
    console.error("Failed to get payment status:", error)
    throw error
  }
}

export async function getMinimumPaymentAmount(currency = "btc"): Promise<number> {
  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/min-amount?currency_from=${currency}&currency_to=usd`, {
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY!,
      },
    })

    if (!response.ok) {
      return 10 // Default minimum $10
    }

    const data = await response.json()
    return data.min_amount || 10
  } catch (error) {
    return 10
  }
}

export async function getEstimatedPrice(amountUSD: number, currency = "btc"): Promise<number> {
  try {
    const response = await fetch(
      `${NOWPAYMENTS_API_URL}/estimate?amount=${amountUSD}&currency_from=usd&currency_to=${currency}`,
      {
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY!,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to get estimate")
    }

    const data = await response.json()
    return data.estimated_amount
  } catch (error) {
    console.error("Failed to get price estimate:", error)
    // Fallback to CoinGecko
    const btcPrice = await getBTCPriceFromCoinGecko()
    return amountUSD / btcPrice
  }
}

// Fallback BTC price from CoinGecko
async function getBTCPriceFromCoinGecko(): Promise<number> {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
    const data = await response.json()
    return data?.bitcoin?.usd || 98500
  } catch {
    return 98500
  }
}

export async function getBTCPrice(): Promise<{ usd: number; updated: Date }> {
  const price = await getBTCPriceFromCoinGecko()
  return {
    usd: price,
    updated: new Date(),
  }
}

export async function verifyBTCTransaction(txHash: string, expectedAmount: number): Promise<boolean> {
  console.warn("[v0] verifyBTCTransaction is deprecated - NOWPayments handles verification automatically")
  return false
}

export async function convertBTCtoUSD(btcAmount: number): Promise<number> {
  const price = await getBTCPriceFromCoinGecko()
  return btcAmount * price
}
