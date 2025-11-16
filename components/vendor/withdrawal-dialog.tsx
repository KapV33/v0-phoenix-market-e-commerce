"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DollarSign } from "lucide-react"

export function WithdrawalDialog({ vendorId, balance, onSuccess }: any) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    cryptoAddress: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/vendor/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(formData.amount),
          cryptoAddress: formData.cryptoAddress,
        }),
      })

      if (!response.ok) throw new Error("Failed to request withdrawal")

      alert("Withdrawal request submitted successfully")
      setOpen(false)
      onSuccess()
      setFormData({ amount: "", cryptoAddress: "" })
    } catch (error) {
      alert("Failed to request withdrawal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="phoenix-gradient">
          <DollarSign className="h-4 w-4 mr-2" />
          Request Withdrawal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Available Balance</Label>
            <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              max={balance}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cryptoAddress">Crypto Wallet Address</Label>
            <Input
              id="cryptoAddress"
              value={formData.cryptoAddress}
              onChange={(e) => setFormData({ ...formData, cryptoAddress: e.target.value })}
              placeholder="Enter your crypto wallet address"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 phoenix-gradient" disabled={loading}>
              {loading ? "Submitting..." : "Request Withdrawal"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
