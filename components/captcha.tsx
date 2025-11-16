"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from 'lucide-react'

interface CaptchaProps {
  onVerify: (verified: boolean) => void
}

export function Captcha({ onVerify }: CaptchaProps) {
  const [captchaText, setCaptchaText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [isVerified, setIsVerified] = useState(false)

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
    setUserInput("")
    setIsVerified(false)
    onVerify(false)
  }

  useEffect(() => {
    generateCaptcha()
  }, [])

  useEffect(() => {
    if (userInput.length === 6) {
      const verified = userInput === captchaText
      setIsVerified(verified)
      onVerify(verified)
    } else {
      setIsVerified(false)
      onVerify(false)
    }
  }, [userInput, captchaText])

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha" className="text-white">Verify you&apos;re human</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 p-3 bg-[#1a2332] rounded-lg border border-accent/30 relative overflow-hidden">
          {/* Background noise elements */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="20" x2="100%" y2="20" stroke="#666" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="0" y1="40" x2="100%" y2="40" stroke="#666" strokeWidth="1" strokeDasharray="6,3" />
            <circle cx="10" cy="30" r="3" fill="#888" opacity="0.3" />
            <circle cx="90%" cy="15" r="4" fill="#888" opacity="0.3" />
            <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#666" strokeWidth="1" opacity="0.3" />
            <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#666" strokeWidth="1" opacity="0.3" />
          </svg>
          
          <div className="flex-1 font-mono text-xl tracking-widest select-none phoenix-gradient-text font-bold relative z-10">
            {captchaText}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={generateCaptcha} className="h-8 w-8 relative z-10">
            <RefreshCw className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
      <Input
        id="captcha"
        type="text"
        placeholder="Enter the code above"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value.slice(0, 6))}
        maxLength={6}
        className={`bg-[#1a2332] border-accent/30 text-white placeholder:text-gray-400 ${isVerified ? "border-green-500" : ""}`}
      />
      {isVerified && <p className="text-sm text-green-500">Captcha verified!</p>}
    </div>
  )
}
