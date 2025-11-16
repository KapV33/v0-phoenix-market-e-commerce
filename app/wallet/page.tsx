"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownLeft, ArrowUpRight, Copy, CheckCircle, Bitcoin, AlertCircle } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount: number
  created_at: string
  description: string | null
}

interface DepositInvoice {
  invoiceId: string
  btcAddress: string
  btcAmount: number
  amountUSD: number
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [depositAmountUSD, setDepositAmountUSD] = useState("")
  const [copied, setCopied] = useState(false)
  const [btcPrice, setBtcPrice] = useState(98500)
  const [invoice, setInvoice] = useState<DepositInvoice | null>(null)
  const [txHash, setTxHash] = useState("")
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    fetchWalletData()
    fetchBTCPrice()
  }, [])

  const fetchBTCPrice = async () => {
    try {
      const res = await fetch("/api/wallet/btc-price")
      const data = await res.json()
      setBtcPrice(data.usd)
    } catch (error) {
      console.error("Failed to fetch BTC price:", error)
    }
  }

  const fetchWalletData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        fetch("/api/wallet", { credentials: "include" }),
        fetch("/api/wallet/transactions", { credentials: "include" }),
      ])

      const walletData = await walletRes.json()
      const transactionsData = await transactionsRes.json()

      setBalance(walletData.balance || 0)
      setTransactions(transactionsData.transactions || [])
    } catch (error) {
      console.error("Failed to fetch wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      alert("Failed to copy address")
    }
  }

  const handleCreateDeposit = async () => {
    if (!depositAmountUSD || Number.parseFloat(depositAmountUSD) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    try {
      const response = await fetch("/api/wallet/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountUSD: Number.parseFloat(depositAmountUSD) }),
      })

      if (!response.ok) throw new Error("Failed to create deposit")

      const data = await response.json()
      setInvoice(data)
    } catch (error) {
      alert("Failed to create deposit invoice")
    }
  }

  const handleConfirmDeposit = async () => {
    if (!invoice || !txHash) {
      alert("Please enter transaction hash")
      return
    }

    setConfirming(true)
    try {
      const response = await fetch("/api/wallet/deposit/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          txHash,
          btcAmount: invoice.btcAmount,
          invoiceId: invoice.invoiceId,
        }),
      })

      if (!response.ok) throw new Error("Failed to confirm deposit")

      const data = await response.json()
      alert(`Deposit confirmed! Added $${data.depositedUSD.toFixed(2)} to your wallet.`)
      setInvoice(null)
      setTxHash("")
      setDepositAmountUSD("")
      fetchWalletData()
    } catch (error) {
      alert("Failed to confirm deposit. Please contact support if you sent the payment.")
    } finally {
      setConfirming(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    if (type === "deposit") return <ArrowDownLeft className="h-4 w-4 text-green-500" />
    return <ArrowUpRight className="h-4 w-4 text-red-500" />
  }

  const getTransactionColor = (type: string) => {
    return type === "deposit" ? "text-green-500" : "text-red-500"
  }

  const balanceInBTC = balance / btcPrice

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-gray-600">Deposit Bitcoin and manage your USD credits</p>
          </div>
          <Bitcoin className="h-12 w-12 text-orange-500" />
        </div>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="text-gray-900">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold phoenix-gradient-text">${balance.toFixed(2)} USD</p>
            <p className="text-2xl text-gray-600 mt-2">≈ {balanceInBTC.toFixed(8)} BTC</p>
            <p className="text-sm text-gray-500 mt-1">BTC Price: ${btcPrice.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="deposit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit BTC</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Deposit Bitcoin</CardTitle>
                <CardDescription>
                  Send BTC to receive USD credits. All deposits go to admin wallet: 1LBRp7sGy4uzfkPqSwov2CAKzNKgHtxPRw
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!invoice ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-gray-900">
                        Amount to Deposit (USD)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={depositAmountUSD}
                        onChange={(e) => setDepositAmountUSD(e.target.value)}
                        placeholder="Enter amount in USD"
                        className="bg-gray-50"
                      />
                      {depositAmountUSD && (
                        <p className="text-xs text-gray-600">
                          You will send: {(Number.parseFloat(depositAmountUSD) / btcPrice).toFixed(8)} BTC
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleCreateDeposit}
                      className="w-full phoenix-gradient text-white font-semibold phoenix-glow"
                    >
                      Create Deposit Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 space-y-4">
                      <div className="flex items-center gap-2 text-orange-800">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-semibold">Payment Details</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-gray-900 text-sm font-semibold">Send exactly:</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              value={`${invoice.btcAmount.toFixed(8)} BTC`}
                              readOnly
                              className="font-mono text-base bg-white"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopyAddress(invoice.btcAmount.toString())}
                            >
                              {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-gray-900 text-sm font-semibold">To this address:</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input value={invoice.btcAddress} readOnly className="font-mono text-sm bg-white" />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopyAddress(invoice.btcAddress)}
                            >
                              {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-sm text-gray-700">
                            <strong>USD Value:</strong> ${invoice.amountUSD.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            After sending, enter your transaction hash below to confirm.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="txhash" className="text-gray-900">
                          Transaction Hash
                        </Label>
                        <Input
                          id="txhash"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="Enter your BTC transaction hash"
                          className="font-mono text-sm bg-gray-50"
                        />
                        <p className="text-xs text-gray-600">
                          Find this in your wallet after sending the payment. For testing, use: simulated_tx_123456
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirmDeposit}
                          disabled={!txHash || confirming}
                          className="flex-1 phoenix-gradient text-white font-semibold phoenix-glow"
                        >
                          {confirming ? "Confirming..." : "Confirm Deposit"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setInvoice(null)
                            setTxHash("")
                          }}
                          className="border-gray-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Bitcoin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-gray-900">How deposits work:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li>Enter the USD amount you want to deposit</li>
                        <li>Send the exact BTC amount to the provided address</li>
                        <li>Enter your transaction hash to confirm</li>
                        <li>Your wallet will be credited in USD after verification</li>
                      </ol>
                      <p className="text-xs text-gray-600 mt-2">
                        All deposits are sent to the marketplace admin wallet for security.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Transaction History</CardTitle>
                <CardDescription>Your wallet activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="font-medium capitalize text-gray-900">{tx.type}</p>
                          <p className="text-sm text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</p>
                          {tx.description && <p className="text-xs text-gray-500">{tx.description}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                          {tx.type === "deposit" ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{(Math.abs(tx.amount) / btcPrice).toFixed(8)} BTC</p>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-center text-gray-500 py-12">No transactions yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
