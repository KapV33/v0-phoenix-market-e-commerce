"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Star, Shield, Package, User } from "lucide-react"
import type { Product } from "@/lib/marketplace"
import { useEffect, useState } from "react"

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  viewMode?: "grid" | "list" // Added viewMode prop for grid/list layouts
}

interface VendorInfo {
  business_name: string
  averageRating: number
  reviewCount: number
}

export function ProductCard({ product, onAddToCart, viewMode = "grid" }: ProductCardProps) {
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
        setVendorInfo({
          business_name: product.vendor_name || "Unknown Vendor",
          averageRating: 4.8, // Default rating for display
          reviewCount: 0,
        })
      })
  }, [product.vendor_id, product.vendor_name])

  const isInStock = product.stock_quantity > 0

  if (viewMode === "list") {
    return (
      <Card className="bg-[#161b22] border-gray-800 p-4 hover:border-orange-500/50 transition-all">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-[#0d1117] rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-800">
            {product.image_url ? (
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="h-10 w-10 text-gray-700" />
            )}
          </div>
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link href={`/market/product/${product.slug}`} className="hover:text-orange-400 transition-colors">
                  <h3 className="font-semibold text-white text-base">{product.name}</h3>
                </Link>
                <div className="flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                  <Shield className="h-3 w-3 text-green-400" />
                  <span className="text-green-400 text-xs font-medium">Escrow</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2 mb-2">{product.description}</p>
              {vendorInfo && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <Link href={`/vendor/${product.vendor_id}`} className="hover:text-orange-400 transition-colors">
                    {vendorInfo.business_name}
                  </Link>
                  {vendorInfo.reviewCount > 0 && (
                    <>
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 ml-1" />
                      <span className="text-gray-400">{vendorInfo.averageRating.toFixed(1)}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-bold text-orange-400">${product.price.toFixed(2)}</div>
              <Button
                size="sm"
                onClick={() => onAddToCart?.(product)}
                disabled={!isInStock}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#161b22] border-gray-800 overflow-hidden hover:border-orange-500/50 transition-all group">
      <Link href={`/market/product/${product.slug}`}>
        <div className="aspect-square bg-[#0d1117] flex items-center justify-center border-b border-gray-800 relative overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Package className="h-20 w-20 text-gray-700" />
          )}
          <div className="absolute top-2 right-2">
            <div className="bg-green-500/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-white flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Escrow
            </div>
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/market/product/${product.slug}`}>
          <h3 className="font-semibold text-white mb-1 line-clamp-2 text-sm hover:text-orange-400 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>

        {vendorInfo && product.vendor_id && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <User className="h-3 w-3" />
            <Link href={`/vendor/${product.vendor_id}`} className="hover:text-orange-400 transition-colors">
              {vendorInfo.business_name}
            </Link>
            {vendorInfo.reviewCount > 0 && (
              <div className="flex items-center gap-0.5 ml-auto">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-gray-400 font-medium">{vendorInfo.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-orange-400">${product.price.toFixed(2)}</div>
          <span className="text-xs text-gray-500">{isInStock ? `${product.stock_quantity} left` : "Out of stock"}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 text-sm"
          onClick={() => onAddToCart?.(product)}
          disabled={!isInStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
