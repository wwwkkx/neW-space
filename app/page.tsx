"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Sparkles, Upload, BarChart3, CheckCircle, Brain, Zap, Shield } from "lucide-react"
import DesktopHome from "./DesktopHome"
import MobileHome from "./MobileHome"

export default function HomePage(props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 检查用户是否已登录
    const token = localStorage.getItem("token")
    if (token) {
      window.location.href = "/dashboard"
    }
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return isMobile ? <MobileHome {...props} /> : <DesktopHome {...props} />
}
