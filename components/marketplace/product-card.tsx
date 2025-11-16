"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Star } from "lucide-react"
import type { Product } from "@/lib/marketplace"
import { useEffect, useState } from "react"

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

interface VendorInfo {
  business_name: string
  averageRating: number
  reviewCount: number
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null)

  useEffect(() => {
    if (!product.vendor_id) {
      return
    }

    fetch(`/api/vendors/${product.vendor_id}/info`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data) => setVendorInfo(data))
      .catch((err) => {
        console.error("Failed to fetch vendor info:", err)
        // Set default vendor info on error
        setVendorInfo({
          business_name: "Unknown Vendor",
          averageRating: 0,
          reviewCount: 0,
        })
      })
  }, [product.vendor_id])

  return (
    <Card className="overflow-hidden bg-[#162330] border-white/10 hover:border-white/30 transition-all hover:shadow-lg hover:shadow-accent/20">
      <Link href={`/market/product/${product.slug}`}>
        <div className="aspect-[11/9] bg-muted relative overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="object-cover w-full h-full hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center phoenix-gradient">
              <span className="text-2xl text-white font-bold">{product.name.charAt(0)}</span>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-2.5">
        <Link href={`/market/product/${product.slug}`}>
          <h3 className="font-semibold text-sm bg-gradient-to-r from-cyan-100 to-white bg-clip-text text-transparent hover:opacity-80 transition-opacity line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {vendorInfo && product.vendor_id && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Link
              href={`/vendor/${product.vendor_id}`}
              className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
            >
              {vendorInfo.business_name}
            </Link>
            {vendorInfo.reviewCount > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                <span className="text-[11px] text-white/80">
                  {vendorInfo.averageRating.toFixed(1)} ({vendorInfo.reviewCount})
                </span>
              </div>
            )}
          </div>
        )}

        {product.description && <p className="text-[11px] text-white/70 mt-0.5 line-clamp-2">{product.description}</p>}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-lg font-bold phoenix-gradient-text">${product.price.toFixed(2)}</span>
          <span className="text-[11px] text-white/60">
            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-2.5 pt-0">
        <Button
          className="w-full phoenix-gradient text-white font-semibold hover:opacity-90 transition-opacity text-xs h-8"
          onClick={() => onAddToCart?.(product)}
          disabled={product.stock_quantity === 0}
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
