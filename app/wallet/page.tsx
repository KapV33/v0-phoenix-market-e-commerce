"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownLeft, ArrowUpRight, AlertCircle, X, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SUPPORTED_CRYPTOS, type CryptoInfo } from "@/lib/nowpayments"
import Image from "next/image"
import { PageHeader } from "@/components/layout/page-header"

interface Transaction {
  id: string
  type: string
  amount: number
  created_at: string
  description: string | null
}

export default function WalletPage() {
  console.log("[v0] WalletPage rendering")

  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [depositAmountUSD, setDepositAmountUSD] = useState("")
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [minAmount, setMinAmount] = useState(10)
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoInfo>(SUPPORTED_CRYPTOS[0])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] WalletPage mounted")
    fetchWalletData()
    fetchMinAmount()
  }, [])

  const fetchWalletData = async () => {
    console.log("[v0] Fetching wallet data...")
    try {
      const res = await fetch("/api/wallet")
      console.log("[v0] Wallet response status:", res.status)
      const data = await res.json()
      console.log("[v0] Wallet data received:", data)

      setBalance(data.balance || 0)
      setTransactions(data.transactions || [])
      setError(null)
    } catch (err) {
      console.error("[v0] Wallet fetch error:", err)
      setError("Failed to load wallet data")
      setBalance(0)
      setTransactions([])
    } finally {
      setLoading(false)
      console.log("[v0] Wallet fetch complete")
    }
  }

  const fetchMinAmount = async () => {
    try {
      const res = await fetch("/api/wallet/min-amount")
      const data = await res.json()
      setMinAmount(data.minAmount || 10)
    } catch (err) {
      console.error("[v0] Failed to fetch min amount:", err)
      setMinAmount(10)
    }
  }

  const handleCreateDeposit = async () => {
    const amount = Number.parseFloat(depositAmountUSD)
    if (isNaN(amount) || amount < minAmount) {
      alert(`Minimum deposit is $${minAmount}`)
      return
    }

    setCreating(true)
    setError(null)

    try {
      const res = await fetch("/api/wallet/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUSD: amount,
          payCurrency: selectedCrypto.id,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create deposit")
      }

      const data = await res.json()
      console.log("[v0] Deposit invoice created:", data)

      setInvoiceUrl(data.invoiceUrl)
      setShowInvoiceModal(true)
      setDepositAmountUSD("")
    } catch (err: any) {
      console.error("[v0] Error creating deposit:", err)
      setError(err.message || "Failed to create deposit invoice")
    } finally {
      setCreating(false)
    }
  }

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false)
    setInvoiceUrl(null)
    fetchWalletData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e]">
        <PageHeader title="Wallet" />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  console.log("[v0] Rendering wallet content, balance:", balance)

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      <PageHeader title="Wallet" />

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-900 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Balance Card */}
        <Card className="mb-8 bg-[#2a3142] border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-white">Balance</CardTitle>
            <CardDescription className="text-gray-400">Your available wallet balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-500">${balance.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Deposit Card */}
        <Card className="mb-8 bg-[#2a3142] border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-white">Deposit Funds</CardTitle>
            <CardDescription className="text-gray-400">
              Choose a cryptocurrency and deposit to your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Crypto Selection */}
            <div>
              <Label className="text-white mb-3 block">Select Cryptocurrency</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SUPPORTED_CRYPTOS.map((crypto) => (
                  <button
                    key={crypto.id}
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      selectedCrypto.id === crypto.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-gray-700 bg-[#1a1f2e] hover:border-gray-600"
                    }`}
                  >
                    <Image
                      src={crypto.icon || "/placeholder.svg"}
                      alt={crypto.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{crypto.symbol}</div>
                      {crypto.network && <div className="text-xs text-gray-400">{crypto.network}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <Label htmlFor="depositAmount" className="text-white">
                Amount (USD)
              </Label>
              <Input
                id="depositAmount"
                type="number"
                value={depositAmountUSD}
                onChange={(e) => setDepositAmountUSD(e.target.value)}
                placeholder={`Minimum $${minAmount}`}
                className="mt-2 bg-[#1a1f2e] border-gray-700 text-white"
                min={minAmount}
                step="0.01"
              />
            </div>

            <Button
              onClick={handleCreateDeposit}
              disabled={creating || !depositAmountUSD}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Deposit with {selectedCrypto.symbol}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="bg-[#2a3142] border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-gray-400">Your wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-[#1a1f2e] rounded-lg">
                    <div className="flex items-center gap-3">
                      {tx.type === "deposit" ? (
                        <ArrowDownLeft className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="text-white font-medium capitalize">{tx.type}</div>
                        <div className="text-sm text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${tx.type === "deposit" ? "text-green-500" : "text-red-500"}`}
                    >
                      {tx.type === "deposit" ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a3142] rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Image
                  src={selectedCrypto.icon || "/placeholder.svg"}
                  alt={selectedCrypto.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <h3 className="text-lg font-semibold text-white">
                  Pay with {selectedCrypto.symbol}
                  {selectedCrypto.network && (
                    <span className="text-sm text-gray-400 ml-2">({selectedCrypto.network})</span>
                  )}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={closeInvoiceModal} className="text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={invoiceUrl}
                className="w-full h-full"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                title="Payment Invoice"
              />
            </div>
            <div className="p-4 border-t border-gray-700 text-center text-sm text-gray-400">
              Your wallet will be credited automatically after payment confirmation
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
