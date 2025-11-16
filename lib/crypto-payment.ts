// Crypto payment utilities for Phoenix Market
import { createClient } from "@/lib/supabase/server"

export interface PaymentAddress {
  address: string
  currency: string
  amount: number
}

// Admin's BTC wallet address for all payments
const ADMIN_BTC_WALLET = "1LBRp7sGy4uzfkPqSwov2CAKzNKgHtxPRw"

// Generate payment address using the real admin wallet
export function generatePaymentAddress(currency = "BTC"): PaymentAddress {
  return {
    address: ADMIN_BTC_WALLET,
    currency,
    amount: 0,
  }
}

// Verify payment (mock implementation)
export async function verifyPayment(txHash: string): Promise<boolean> {
  // In production, verify transaction on blockchain
  // For demo purposes, we'll simulate verification
  return txHash.length > 10
}

// Process order and deliver digital content
export async function processOrderDelivery(orderId: string) {
  const supabase = await createClient()

  try {
    // Get order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      throw new Error("Order not found")
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", order.product_id)
      .single()

    if (productError || !product) {
      throw new Error("Product not found")
    }

    // Update order with delivery content
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        delivery_status: "delivered",
        delivered_content: product.delivery_content,
      })
      .eq("id", orderId)

    if (updateError) {
      throw new Error("Failed to update order")
    }

    // Decrease product stock
    await supabase
      .from("products")
      .update({
        stock_quantity: Math.max(0, product.stock_quantity - 1),
      })
      .eq("id", product.id)

    return true
  } catch (error) {
    console.error("Order delivery failed:", error)
    return false
  }
}

// Confirm payment and trigger auto-delivery
export async function confirmPayment(orderId: string, txHash: string) {
  const supabase = await createClient()

  try {
    // Verify transaction
    const isValid = await verifyPayment(txHash)

    if (!isValid) {
      throw new Error("Invalid transaction")
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "confirmed",
        payment_tx_hash: txHash,
      })
      .eq("id", orderId)

    if (updateError) {
      throw new Error("Failed to update payment status")
    }

    // Trigger auto-delivery
    await processOrderDelivery(orderId)

    return true
  } catch (error) {
    console.error("Payment confirmation failed:", error)
    return false
  }
}
