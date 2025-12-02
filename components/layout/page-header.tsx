"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
}

export function PageHeader({
  title,
  subtitle,
  showBackButton = true,
  backButtonText = "Back",
  backButtonHref,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref)
    } else {
      router.back()
    }
  }

  return (
    <header className="border-b-2 border-border shadow-md sticky top-0 z-50 bg-[#162330]/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between">
          <Link href="/market" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image
              src="/images/photo-2020-07-22-00-13-11-removebg-preview-281-29.png"
              alt="Phoenix Market"
              width={56}
              height={56}
              className="h-14 w-14"
            />
            <h1 className="text-xl font-bold phoenix-logo-text-gradient">Phoenix Market</h1>
          </Link>

          {showBackButton && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-white/30 text-white hover:bg-white/10 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backButtonText}
            </Button>
          )}
        </div>

        {(title || subtitle) && (
          <div className="mt-3">
            {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
            {subtitle && <p className="text-gray-300 text-sm mt-1">{subtitle}</p>}
          </div>
        )}
      </div>
    </header>
  )
}
