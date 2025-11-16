"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ArrowLeft, User } from "lucide-react"

interface VendorProfile {
  id: string
  business_name: string
  bio: string
  avatar_url: string
  created_at: string
  averageRating: number
  reviewCount: number
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  user: {
    username: string
  }
}

export default function VendorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.vendorId as string
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/vendors/${vendorId}/profile`).then((res) => res.json()),
      fetch(`/api/vendors/${vendorId}/reviews`).then((res) => res.json()),
    ])
      .then(([vendorData, reviewsData]) => {
        setVendor(vendorData)
        // Ensure reviewsData is an array before setting it
        setReviews(Array.isArray(reviewsData) ? reviewsData : [])
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("[v0] Failed to load vendor profile:", error)
        setIsLoading(false)
      })
  }, [vendorId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading vendor profile...</p>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vendor not found</p>
      </div>
    )
  }

  const averageRating = vendor.averageRating ?? 0
  const reviewCount = vendor.reviewCount ?? 0

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="bg-[#162330] border-white/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center">
                {vendor.avatar_url ? (
                  <img
                    src={vendor.avatar_url || "/placeholder.svg"}
                    alt={vendor.business_name}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white">{vendor.business_name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= averageRating ? "fill-yellow-500 text-yellow-500" : "text-white/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white/80">
                    {averageRating > 0 ? `${averageRating.toFixed(1)} (${reviewCount} reviews)` : "No reviews yet"}
                  </span>
                </div>
                {vendor.bio && <p className="text-white/70 mt-4">{vendor.bio}</p>}
                <p className="text-white/50 text-sm mt-2">
                  Member since {new Date(vendor.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#162330] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-white/60 text-center py-8">No reviews yet</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-white/10 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{review.user.username}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-white/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-white/50 text-sm">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-white/70">{review.comment}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
