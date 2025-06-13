"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-xl font-bold">出现错误</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">抱歉，页面加载时出现了问题。</p>
          <div className="space-y-2">
            <Button onClick={reset} className="w-full">
              重试
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
