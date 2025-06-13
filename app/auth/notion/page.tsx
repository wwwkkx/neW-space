"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, ExternalLink, Database, Key, User } from "lucide-react"

export default function NotionAuth() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")

  const [step, setStep] = useState(1)
  const [notionToken, setNotionToken] = useState("")
  const [databaseId, setDatabaseId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authComplete, setAuthComplete] = useState(false)

  const handleCreateIntegration = () => {
    window.open("https://www.notion.so/my-integrations", "_blank")
  }

  const handleTestConnection = async () => {
    if (!notionToken || !databaseId) {
      alert("请填写完整的Token和数据库ID")
      return
    }

    setIsLoading(true)
    try {
      // 测试Notion连接
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      })

      if (response.ok) {
        // 保存用户授权信息
        await fetch("/api/user/auth-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            notionToken,
            databaseId,
          }),
        })

        setAuthComplete(true)
      } else {
        alert("连接失败，请检查Token和数据库ID是否正确")
      }
    } catch (error) {
      alert("连接测试失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const createDatabase = async () => {
    if (!notionToken) {
      alert("请先填写Notion Token")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/setup-notion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${notionToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDatabaseId(data.database.id)
        setStep(3)
      } else {
        alert("创建数据库失败，请检查Token权限")
      }
    } catch (error) {
      alert("创建数据库失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  if (authComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">授权成功！</h1>
            <p className="text-gray-600 mb-6">
              您现在可以回到微信，直接发送文字消息，我会自动生成日记并保存到您的Notion！
            </p>
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              💡 使用提示：直接在微信中发送任何想法、感受或记录，AI会自动分析并创建结构化日记。
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">连接您的Notion</h1>
          <p className="text-gray-600">完成授权后，即可开始自动日记功能</p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {num}
              </div>
              {num < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                步骤1：创建Notion集成
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium mb-2">创建步骤：</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>点击下方按钮访问Notion集成页面</li>
                  <li>点击"新建集成"</li>
                  <li>填写集成名称（如：微信日记AI）</li>
                  <li>选择工作区</li>
                  <li>点击"提交"</li>
                  <li>复制生成的"Internal Integration Token"</li>
                </ol>
              </div>

              <Button onClick={handleCreateIntegration} className="w-full" size="lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                前往Notion创建集成
              </Button>

              <div className="space-y-2">
                <Label htmlFor="token">Notion Integration Token</Label>
                <Input
                  id="token"
                  placeholder="secret_..."
                  value={notionToken}
                  onChange={(e) => setNotionToken(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={() => setStep(2)} disabled={!notionToken} className="w-full">
                下一步
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                步骤2：创建数据库
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  我们将为您创建一个专门的日记数据库，包含标题、分类、情绪、关键词等字段。
                </p>
              </div>

              <Button onClick={createDatabase} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? "创建中..." : "🚀 创建日记数据库"}
              </Button>

              <div className="text-center">
                <Button variant="link" onClick={() => setStep(3)}>
                  我已有数据库，直接填写ID
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                步骤3：完成授权
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="database">数据库ID</Label>
                <Input
                  id="database"
                  placeholder="数据库ID（32位字符）"
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  在Notion数据库页面URL中找到，格式如：19bd365876894610978d0260a48d9885
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg text-sm">
                <p className="font-medium mb-1">⚠️ 重要提醒：</p>
                <p>请确保在Notion数据库中添加您创建的集成连接，否则无法写入数据。</p>
              </div>

              <Button
                onClick={handleTestConnection}
                disabled={isLoading || !notionToken || !databaseId}
                className="w-full"
                size="lg"
              >
                {isLoading ? "测试连接中..." : "✅ 完成授权"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
