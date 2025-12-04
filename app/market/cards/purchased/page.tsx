"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Flame, ArrowLeft, Copy, Check } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PurchasedCard {
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
  full_card_data: string
  purchased_at: string
}

export default function PurchasedCardsPage() {
  const [cards, setCards] = useState<PurchasedCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userId = document.cookie.match(/phoenix_user_id=([^;]+)/)?.[1]
    if (!userId) {
      router.push("/auth/login")
      return
    }

    fetch("/api/marketplace/cards/purchased")
      .then((res) => res.json())
      .then((data) => {
        setCards(data.cards || [])
        setIsLoading(false)
      })
  }, [router])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-gray-400">Loading your purchases...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-gray-800 bg-[#161b22]/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/market/cards")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
              <Link href="/market" className="flex items-center gap-2.5">
                <div className="bg-gradient-to-br from-orange-500 via-red-500 to-yellow-600 p-2 rounded-lg">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                    My Purchased Cards
                  </h1>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {cards.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">You haven't purchased any cards yet</p>
            <Button onClick={() => router.push("/market/cards")}>Browse Cards Shop</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="bg-[#161b22] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>
                      {card.name} - {card.country}
                    </span>
                    <span className="text-orange-400 text-lg">${card.price.toFixed(2)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">BIN</p>
                      <p className="text-white font-mono">{card.bin}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">City/State</p>
                      <p className="text-white">
                        {card.city}, {card.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">ZIP</p>
                      <p className="text-white">{card.zip}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Purchased</p>
                      <p className="text-white">{new Date(card.purchased_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-green-400 font-semibold">Full Card Data</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(card.full_card_data, card.id)}
                        className="border-gray-700"
                      >
                        {copiedId === card.id ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap break-all">
                      {card.full_card_data}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
