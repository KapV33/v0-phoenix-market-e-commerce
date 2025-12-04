"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, TrendingUp, Wallet, Save } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminFinancesPage() {
  const [commissionRate, setCommissionRate] = useState<number>(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    totalEscrow: 0,
  })
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    title: string
    message: string
    variant: "success" | "error"
  }>({
    open: false,
    title: "",
    message: "",
    variant: "success",
  })
  const router = useRouter()

  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    try {
      const response = await fetch("/api/admin/finances")
      if (!response.ok) throw new Error("Failed to load finance data")

      const data = await response.json()
      setCommissionRate(data.commissionRate || 10)
      setStats(data.stats || { totalRevenue: 0, totalCommissions: 0, totalEscrow: 0 })
    } catch (error) {
      console.error("Failed to load finance data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCommission = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/finances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate }),
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to save commission rate")

      setAlertDialog({
        open: true,
        title: "Success",
        message: "Commission rate updated successfully!",
        variant: "success",
      })
    } catch (error) {
      setAlertDialog({
        open: true,
        title: "Error",
        message: "Failed to update commission rate",
        variant: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading finance data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Financial Management</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Commissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold phoenix-gradient-text">${stats.totalCommissions.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">In Escrow</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${stats.totalEscrow.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Commission Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commissionRate" className="text-foreground">
                Marketplace Commission Rate (%)
              </Label>
              <div className="flex gap-4">
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number.parseFloat(e.target.value))}
                  className="max-w-xs bg-input border-border text-foreground"
                />
                <Button onClick={handleSaveCommission} disabled={isSaving} className="phoenix-gradient text-white">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This percentage will be deducted from vendor earnings on each sale
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground mb-2">Admin Bitcoin Wallet</h3>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-mono text-foreground break-all">1LBRp7sGy4uzfkPqSwov2CAKzNKgHtxPRw</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">All commission deposits are sent to this address</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent className="bg-[#1a1f2e] border-orange-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle
              className={`flex items-center gap-2 ${alertDialog.variant === "success" ? "text-green-500" : "text-red-500"}`}
            >
              {alertDialog.variant === "success" ? <Save className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
              {alertDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">{alertDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-orange-600 text-white hover:bg-orange-700">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
