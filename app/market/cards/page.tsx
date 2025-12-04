"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Flame, LogOut, User, Wallet, Search, ShoppingCart, Package, CreditCard, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Card {
  id: string
  bin: string
  country: string
  base_seller: string
  name: string
  city: string
  state: string
  zip: string
  fullz: string
  price: number
  vendor_id: string
  is_sold: boolean
  full_card_data?: string // Only visible after purchase
}

export default function CardsShopPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [filteredCards, setFilteredCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [countryFilter, setCountryFilter] = useState("all")
  const [walletBalance, setWalletBalance] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
    if (!userId) {
      router.push("/auth/login")
      return
    }

    Promise.all([
      fetch("/api/marketplace/cards").then((res) => res.json()),
      fetch("/api/wallet").then((res) => res.json()),
    ]).then(([cardsData, walletData]) => {
      setCards(cardsData.cards || [])
      setFilteredCards(cardsData.cards || [])
      setWalletBalance(walletData.balance || 0)
      setIsLoading(false)
    })
  }, [router])

  useEffect(() => {
    let filtered = cards.filter((card) => !card.is_sold)

    if (searchQuery) {
      filtered = filtered.filter(
        (card) =>
          card.bin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.base_seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.state.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (countryFilter !== "all") {
      filtered = filtered.filter((card) => card.country.toLowerCase() === countryFilter.toLowerCase())
    }

    setFilteredCards(filtered)
  }, [searchQuery, countryFilter, cards])

  const handlePurchase = async (card: Card) => {
    if (walletBalance < card.price) {
      alert("Insufficient balance! Please add funds to your wallet.")
      router.push("/wallet")
      return
    }

    if (!confirm(`Purchase this card for $${card.price.toFixed(2)}?`)) {
      return
    }

    try {
      const response = await fetch("/api/marketplace/cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Purchase failed")
        return
      }

      alert("Purchase successful! Card details revealed.")

      // Update the card in the list with full data
      setCards((prevCards) =>
        prevCards.map((c) => (c.id === card.id ? { ...c, is_sold: true, full_card_data: data.full_card_data } : c)),
      )
      setWalletBalance(data.newBalance)

      // Show purchased cards page
      router.push("/market/cards/purchased")
    } catch (error) {
      console.error("Purchase error:", error)
      alert("Purchase failed. Please try again.")
    }
  }

  const handleLogout = () => {
    document.cookie = "phoenix_user_id=; path=/; max-age=0"
    router.push("/auth/login")
  }

  const countries = ["all", ...Array.from(new Set(cards.map((c) => c.country)))]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="h-16 w-16 mx-auto text-orange-500 animate-pulse mb-4" />
          <p className="text-gray-400">Loading cards shop...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/market")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Market
              </Button>
              <Link href="/market" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className="bg-gradient-to-br from-orange-500 via-red-500 to-yellow-600 p-2 rounded-lg shadow-lg">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                    Cards Shop
                  </h1>
                  <p className="text-[10px] text-gray-500">Instant Digital Purchases</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-4">
                <p className="text-xs text-gray-500">Wallet Balance</p>
                <p className="text-lg font-bold text-orange-400">${walletBalance.toFixed(2)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/wallet")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/market/cards/purchased")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <Package className="h-4 w-4 mr-2" />
                My Cards
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/profile")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-9 w-9"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by BIN, country, seller, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0d1117] border-gray-700 text-gray-300 placeholder:text-gray-600"
              />
            </div>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-md text-sm text-gray-300"
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country === "all" ? "All Countries" : country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Available Cards</p>
            <p className="text-2xl font-bold text-white">{filteredCards.length}</p>
          </div>
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Countries</p>
            <p className="text-2xl font-bold text-white">{countries.length - 1}</p>
          </div>
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Your Balance</p>
            <p className="text-2xl font-bold text-orange-400">${walletBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Cards Table */}
        <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">BIN</TableHead>
                <TableHead className="text-gray-400">Country</TableHead>
                <TableHead className="text-gray-400">Base/Seller</TableHead>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">City</TableHead>
                <TableHead className="text-gray-400">State</TableHead>
                <TableHead className="text-gray-400">ZIP</TableHead>
                <TableHead className="text-gray-400">Fullz</TableHead>
                <TableHead className="text-gray-400">Price</TableHead>
                <TableHead className="text-gray-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                    No cards available matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredCards.map((card) => (
                  <TableRow key={card.id} className="border-gray-800 hover:bg-gray-900/50">
                    <TableCell className="font-mono text-sm text-gray-300">{card.bin}</TableCell>
                    <TableCell className="text-gray-300">{card.country}</TableCell>
                    <TableCell className="text-gray-300">{card.base_seller}</TableCell>
                    <TableCell className="text-gray-300">{card.name}</TableCell>
                    <TableCell className="text-gray-300">{card.city}</TableCell>
                    <TableCell className="text-gray-300">{card.state}</TableCell>
                    <TableCell className="text-gray-300">{card.zip}</TableCell>
                    <TableCell>
                      <Badge
                        variant={card.fullz === "Yes" ? "default" : "secondary"}
                        className="bg-green-500/20 text-green-400 border-green-500/30"
                      >
                        {card.fullz}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-orange-400">${card.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(card)}
                        disabled={walletBalance < card.price}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
