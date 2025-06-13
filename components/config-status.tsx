"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Settings, TestTube, ExternalLink } from "lucide-react"

interface ConfigStatus {
  deepseek: boolean
  notion: boolean
}

interface NotionTestResult {
  success?: boolean
  error?: string
  details?: string
  suggestions?: string[]
  code?: string
  databaseId?: string
  message?: string
}

export function ConfigStatus() {
  const [status, setStatus] = useState<ConfigStatus>({ deepseek: false, notion: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isTestingNotion, setIsTestingNotion] = useState(false)
  const [notionTestResult, setNotionTestResult] = useState<NotionTestResult | null>(null)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      const response = await fetch("/api/config-status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error checking configuration:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const testNotionConnection = async () => {
    setIsTestingNotion(true)
    setNotionTestResult(null)

    try {
      const response = await fetch("/api/test-notion")
      const data = await response.json()
      setNotionTestResult(data)
    } catch (error) {
      setNotionTestResult({
        error: "网络错误",
        details: `无法连接到服务器: ${error}`,
      })
    } finally {
      setIsTestingNotion(false)
    }
  }

  if (isLoading) return null

  const allConfigured = status.deepseek && status.notion

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          配置状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            {status.deepseek ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <Badge variant={status.deepseek ? "default" : "destructive"}>
              DeepSeek API {status.deepseek ? "已配置" : "未配置"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {status.notion ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <Badge variant={status.notion ? "default" : "secondary"}>
              Notion API {status.notion ? "已配置" : "未配置"}
            </Badge>
          </div>
          {status.notion && (
            <Button
              size="sm"
              variant="outline"
              onClick={testNotionConnection}
              disabled={isTestingNotion}
              className="flex items-center gap-1"
            >
              <TestTube className="w-3 h-3" />
              {isTestingNotion ? "测试中..." : "测试连接"}
            </Button>
          )}
        </div>

        {notionTestResult && (
          <div className="mb-3 p-3 rounded-lg border">
            {notionTestResult.success ? (
              <div className="text-green-700 bg-green-50">
                <div className="font-medium">{notionTestResult.message}</div>
              </div>
            ) : (
              <div className="text-red-700 bg-red-50">
                <div className="font-medium mb-2">❌ {notionTestResult.error}</div>
                {notionTestResult.details && <div className="text-sm mb-2">{notionTestResult.details}</div>}
                {notionTestResult.suggestions && (
                  <div className="text-sm">
                    <div className="font-medium mb-1">解决建议：</div>
                    <ul className="list-disc list-inside space-y-1">
                      {notionTestResult.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {notionTestResult.code === "object_not_found" && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                    <div className="flex items-center gap-2 font-medium text-yellow-800">
                      <ExternalLink className="w-4 h-4" />
                      需要授权集成访问数据库
                    </div>
                    <div className="mt-1 text-yellow-700">
                      请在 Notion 中打开您的数据库，点击右上角的"..."菜单，选择"添加连接"，然后添加您的集成。
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!allConfigured && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              {!status.deepseek && "请配置 DEEPSEEK_API_KEY 环境变量以使用 AI 功能。"}
              {!status.notion && " Notion API 配置可选，用于自动保存功能。"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
