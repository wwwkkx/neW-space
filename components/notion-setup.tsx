"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ExternalLink, Database, AlertCircle, Loader2, Copy } from "lucide-react"

interface NotionSetupProps {
  userId: string
}

export function NotionSetup({ userId }: NotionSetupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [userId])

  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuth(true)

      // 首先检查 localStorage
      const localAuth = localStorage.getItem(`notion_auth_${userId}`)
      if (localAuth) {
        const authData = JSON.parse(localAuth)
        setAuthStatus({ authorized: true, ...authData })
        setIsCheckingAuth(false)
        return
      }

      // 然后检查服务器
      const response = await fetch(`/api/notion/auth?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.authorized) {
          // 保存到 localStorage
          localStorage.setItem(`notion_auth_${userId}`, JSON.stringify(data))
        }
        setAuthStatus(data)
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("已复制到剪贴板")
  }

  const handleNotionAuth = () => {
    setIsLoading(true)

    // 生成随机状态值以防止CSRF攻击
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem("notionAuthState", state)
    localStorage.setItem("notionAuthUserId", userId)

    // 构建授权URL - 不对 redirect_uri 进行编码
    const redirectUri = "https://v0-wechat-chatbot.vercel.app/api/notion/callback"
    const clientId = "20fd872b-594c-80c8-8a2a-0037508ad3b7"

    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&owner=user`

    console.log("Notion auth URL:", notionAuthUrl)
    console.log("Redirect URI:", redirectUri)

    // 打开授权窗口
    const authWindow = window.open(notionAuthUrl, "notionAuth", "width=600,height=700,scrollbars=yes,resizable=yes")

    // 监听授权窗口关闭
    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed)
        setIsLoading(false)
        // 检查授权状态
        setTimeout(() => {
          checkAuthStatus()
        }, 1000)
      }
    }, 1000)

    // 监听来自授权窗口的消息
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === "NOTION_AUTH_SUCCESS") {
        clearInterval(checkClosed)
        authWindow?.close()
        setIsLoading(false)

        // 保存授权数据到服务器和本地
        const authData = event.data.data
        fetch("/api/notion/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...authData }),
        }).then(() => {
          // 保存到 localStorage
          localStorage.setItem(`notion_auth_${userId}`, JSON.stringify({ authorized: true, ...authData }))
          setAuthStatus({ authorized: true, ...authData })
        })

        window.removeEventListener("message", handleMessage)
        alert("Notion授权成功！您的笔记和文档将自动同步到Notion。")
      } else if (event.data.type === "NOTION_AUTH_ERROR") {
        clearInterval(checkClosed)
        authWindow?.close()
        setIsLoading(false)
        window.removeEventListener("message", handleMessage)
        alert(`Notion授权失败: ${event.data.error}`)
      }
    }

    window.addEventListener("message", handleMessage)

    // 10分钟后自动清理
    setTimeout(() => {
      clearInterval(checkClosed)
      window.removeEventListener("message", handleMessage)
      if (authWindow && !authWindow.closed) {
        authWindow.close()
      }
      setIsLoading(false)
    }, 600000)
  }

  const handleDisconnect = () => {
    if (confirm("确定要断开Notion连接吗？")) {
      localStorage.removeItem(`notion_auth_${userId}`)
      setAuthStatus({ authorized: false })
    }
  }

  if (isCheckingAuth) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">检查授权状态...</p>
        </CardContent>
      </Card>
    )
  }

  if (authStatus?.authorized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Notion 已连接
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 mb-2">✅ 您的Notion已成功连接！</p>
            <p className="text-sm text-green-700">笔记和文档会自动同步到您的Notion数据库。</p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="text-sm">
              <span className="font-medium">工作区: </span>
              <span>{authStatus.workspaceName || "已连接"}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">数据库: </span>
              <span>{authStatus.databaseName || "智能笔记助手"}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                断开连接
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAuthStatus(null)}>
                重新授权
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Notion 数据库设置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 配置说明 */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <div className="font-medium mb-2">⚠️ 如果遇到 "redirect_uri 缺失或无效" 错误</div>
              <div className="mb-2">请先在 Notion 开发者页面正确配置 OAuth 设置：</div>
              <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)} className="mb-2">
                {showConfig ? "隐藏" : "显示"}配置步骤
              </Button>
            </div>
          </div>
        </div>

        {/* 详细配置步骤 */}
        {showConfig && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-3">📋 Notion 开发者页面配置步骤：</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium mb-1">1. 访问 Notion 开发者页面：</div>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://www.notion.so/my-integrations</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard("https://www.notion.so/my-integrations")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="font-medium mb-1">2. 找到您的集成，点击 "编辑"</div>
              </div>

              <div>
                <div className="font-medium mb-1">3. 在 "OAuth Domain and URIs" 部分设置：</div>
                <div className="ml-4 space-y-2">
                  <div>
                    <div className="text-gray-600">OAuth Domain:</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">v0-wechat-chatbot.vercel.app</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("v0-wechat-chatbot.vercel.app")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Redirect URIs:</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        https://v0-wechat-chatbot.vercel.app/api/notion/callback
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("https://v0-wechat-chatbot.vercel.app/api/notion/callback")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-medium mb-1">4. 点击 "Save changes" 保存设置</div>
              </div>

              <div>
                <div className="font-medium mb-1">5. 等待几分钟让配置生效，然后重试授权</div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">一键连接Notion</div>
              <div>点击下方按钮，在弹出窗口中授权，我们将自动创建并配置您的Notion数据库。</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">🔐 授权后您将获得：</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 自动创建专属的笔记数据库</li>
            <li>• 笔记和文档实时同步</li>
            <li>• 智能分类和标签管理</li>
            <li>• 月度报告自动生成</li>
          </ul>
        </div>

        <Button onClick={handleNotionAuth} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              授权中...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              一键授权Notion
            </>
          )}
        </Button>

        {isLoading && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">📱 请在弹出的窗口中完成Notion授权，授权完成后窗口会自动关闭。</p>
          </div>
        )}

        {/* 调试信息 */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">调试信息</summary>
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div>Client ID: 20fd872b-594c-80c8-8a2a-0037508ad3b7</div>
            <div>Redirect URI: https://v0-wechat-chatbot.vercel.app/api/notion/callback</div>
            <div>Current Domain: {window.location.hostname}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
