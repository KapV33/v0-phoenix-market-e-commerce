"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownLeft, ArrowUpRight, Bitcoin, ExternalLink, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [btcPrice, setBtcPrice] = useState(98500)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [minAmount, setMinAmount] = useState(10)

  useEffect(() => {
    fetchWalletData()
    fetchBTCPrice()
    fetchMinAmount()
  }, [])

  const fetchMinAmount = async () => {
    try {
      const res = await fetch("/api/wallet/min-amount")
      const data = await res.json()
      setMinAmount(data.minAmount || 10)
    } catch (error) {
      console.error("Failed to fetch min amount:", error)
    }
  }

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

  const handleCreateDeposit = async () => {
    if (!depositAmountUSD || Number.parseFloat(depositAmountUSD) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (Number.parseFloat(depositAmountUSD) < minAmount) {
      alert(`Minimum deposit amount is $${minAmount}`)
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/wallet/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountUSD: Number.parseFloat(depositAmountUSD) }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create deposit")
      }

      const data = await response.json()
      setInvoiceUrl(data.invoiceUrl)
      setInvoiceData(data)
    } catch (error: any) {
      alert(error.message || "Failed to create deposit invoice")
    } finally {
      setCreating(false)
    }
  }

  const handleOpenInvoice = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, "_blank")
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
            <p className="text-gray-600">Deposit Bitcoin via NOWPayments</p>
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
                <CardDescription>Deposit via NOWPayments - Secure, instant BTC payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!invoiceUrl ? (
                  <div className="space-y-4">
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-gray-700">
                        Minimum deposit: <strong>${minAmount}</strong>. Payments are processed instantly via
                        NOWPayments.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-gray-900">
                        Amount to Deposit (USD)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min={minAmount}
                        value={depositAmountUSD}
                        onChange={(e) => setDepositAmountUSD(e.target.value)}
                        placeholder={`Enter amount (min $${minAmount})`}
                        className="bg-gray-50"
                      />
                      {depositAmountUSD && Number.parseFloat(depositAmountUSD) >= minAmount && (
                        <p className="text-xs text-gray-600">
                          Approximately: {(Number.parseFloat(depositAmountUSD) / btcPrice).toFixed(8)} BTC
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleCreateDeposit}
                      disabled={creating || !depositAmountUSD || Number.parseFloat(depositAmountUSD) < minAmount}
                      className="w-full phoenix-gradient text-white font-semibold phoenix-glow"
                    >
                      {creating ? "Creating Invoice..." : "Create Payment Invoice"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Alert className="bg-green-50 border-green-300">
                      <Bitcoin className="h-5 w-5 text-green-600" />
                      <AlertDescription className="text-gray-700">
                        <strong>Payment invoice created!</strong> Click below to complete your payment via NOWPayments.
                      </AlertDescription>
                    </Alert>

                    <div className="border-2 border-orange-300 rounded-lg p-6 space-y-4 bg-popover">
                      <div>
                        <Label className="text-gray-900 font-semibold">Amount:</Label>
                        <p className="text-2xl font-bold text-gray-900">${invoiceData.amountUSD.toFixed(2)} USD</p>
                      </div>

                      <div>
                        <Label className="text-gray-900 font-semibold">Payment Currency:</Label>
                        <p className="text-lg text-gray-700 uppercase">{invoiceData.payCurrency}</p>
                      </div>

                      <Button
                        onClick={handleOpenInvoice}
                        className="w-full phoenix-gradient text-white font-semibold phoenix-glow"
                        size="lg"
                      >
                        <ExternalLink className="mr-2 h-5 w-5" />
                        Pay with NOWPayments
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setInvoiceUrl(null)
                          setInvoiceData(null)
                          setDepositAmountUSD("")
                        }}
                        className="w-full border-gray-300"
                      >
                        Create New Invoice
                      </Button>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm text-gray-700">
                        After completing payment, your wallet will be automatically credited. This usually takes a few
                        minutes.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Bitcoin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-gray-900">How NOWPayments deposits work:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li>Enter the USD amount you want to deposit</li>
                        <li>Click "Create Payment Invoice" to generate a NOWPayments invoice</li>
                        <li>Complete the payment on the NOWPayments secure page</li>
                        <li>Your wallet is automatically credited after payment confirmation</li>
                      </ol>
                      <p className="text-xs text-gray-600 mt-2">
                        NOWPayments is a trusted crypto payment processor with instant confirmations.
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
