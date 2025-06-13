"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  FileText,
  PlusCircle,
  Calendar,
  TrendingUp,
  BookOpen,
  Briefcase,
  Coffee,
  BarChart3,
  Settings,
  Upload,
  Search,
  Filter,
  Star,
} from "lucide-react"
import { NoteEditor } from "@/components/note-editor"
import { DocumentUpload } from "@/components/document-upload"
import { NotionSetup } from "@/components/notion-setup"
import { DocumentView } from "@/components/document-view"
import { NoteView } from "@/components/note-view"

interface User {
  id: string
  name: string
  email: string
  notionConnected?: boolean
}

interface Note {
  id: string
  title: string
  summary: string
  category: string
  tags: string[]
  priority: string
  createdAt: string
}

interface Document {
  id: string
  title: string
  summary: string
  category: string
  tags: string[]
  documentType: string
  fileName: string
  createdAt: string
}

export default function Dashboard() {
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // 使用 useCallback 来稳定 loadUserData 函数
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // 加载笔记
      const notesResponse = await fetch(`/api/notes?userId=${userId}`)
      if (notesResponse.ok) {
        const notesData = await notesResponse.json()
        setNotes(notesData.notes || [])
      }

      // 加载文档
      const docsResponse = await fetch(`/api/documents?userId=${userId}`)
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocuments(docsData.documents || [])
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }, [])

  // 初始化用户和检查登录状态
  useEffect(() => {
    if (isInitialized) return

    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      window.location.href = "/auth"
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    loadUserData(parsedUser.id)
    setIsInitialized(true)
  }, [isInitialized, loadUserData])

  // 处理移动端检测
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // 处理 Notion 授权回调 - 只在组件挂载时检查一次
  useEffect(() => {
    if (!isInitialized) return

    const notionAuth = searchParams.get("notionAuth")

    if (notionAuth === "success") {
      alert("Notion授权成功！您的笔记和文档将自动同步到Notion。")
      // 清除URL参数
      window.history.replaceState({}, "", "/dashboard")
    } else if (notionAuth === "failed") {
      const error = searchParams.get("error") || "未知错误"
      alert(`Notion授权失败: ${error}`)
      // 清除URL参数
      window.history.replaceState({}, "", "/dashboard")
    }
  }, [isInitialized, searchParams])

  const generateMonthlyReport = async () => {
    if (!user) return

    setIsGeneratingReport(true)
    try {
      const now = new Date()
      const response = await fetch("/api/monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
      })

      if (response.ok) {
        alert("月报生成成功！已自动同步到Notion")
      } else {
        alert("月报生成失败，请重试")
      }
    } catch (error) {
      alert("月报生成失败，请重试")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleNoteCreated = useCallback(() => {
    if (user) {
      loadUserData(user.id)
    }
  }, [user, loadUserData])

  const handleDocumentUploaded = useCallback(() => {
    if (user) {
      loadUserData(user.id)
    }
  }, [user, loadUserData])

  const handleDocumentClick = (documentId: string) => {
    setSelectedDocument(documentId)
  }

  const handleNoteClick = (noteId: string) => {
    setSelectedNote(noteId)
  }

  const handleBackFromDocument = () => {
    setSelectedDocument(null)
  }

  const handleBackFromNote = () => {
    setSelectedNote(null)
  }

  // 过滤和搜索功能
  const filteredNotes = notes
    .filter((note) => (selectedCategory === "全部" ? true : note.category === selectedCategory))
    .filter((note) =>
      searchQuery
        ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : true,
    )

  const filteredDocuments = documents
    .filter((doc) => (selectedCategory === "全部" ? true : doc.category === selectedCategory))
    .filter((doc) =>
      searchQuery
        ? doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    )

  const categoryStats = {
    日常: notes.filter((n) => n.category === "日常").length + documents.filter((d) => d.category === "日常").length,
    工作: notes.filter((n) => n.category === "工作").length + documents.filter((d) => d.category === "工作").length,
    学习: notes.filter((n) => n.category === "学习").length + documents.filter((d) => d.category === "学习").length,
    其他: notes.filter((n) => n.category === "其他").length + documents.filter((d) => d.category === "其他").length,
  }

  if (!user || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">欢迎回来，{user.name}！</h1>
          <p className="text-gray-600">管理您的笔记和文档，让AI帮您整理思路</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isMobile ? "grid-cols-3" : "grid-cols-5"}`}>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="notes">笔记</TabsTrigger>
            <TabsTrigger value="documents">文档</TabsTrigger>
            {!isMobile && <TabsTrigger value="reports">月报</TabsTrigger>}
            <TabsTrigger value="settings">设置</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总笔记</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{notes.length}</p>
                    </div>
                    <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总文档</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{documents.length}</p>
                    </div>
                    <Upload className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">本月新增</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">
                        {
                          [...notes, ...documents].filter((item) => {
                            const itemDate = new Date(item.createdAt)
                            const now = new Date()
                            return (
                              itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
                            )
                          }).length
                        }
                      </p>
                    </div>
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Notion状态</p>
                      <p className="text-sm font-bold text-gray-900">{user.notionConnected ? "已连接" : "未连接"}</p>
                    </div>
                    <Settings className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 分类统计 */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <BarChart3 className="w-5 h-5" />
                  分类统计
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
                    <Coffee className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium text-sm md:text-base">日常</div>
                    <div className="text-xl md:text-2xl font-bold text-blue-600">{categoryStats.日常}</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg">
                    <Briefcase className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-green-600" />
                    <div className="font-medium text-sm md:text-base">工作</div>
                    <div className="text-xl md:text-2xl font-bold text-green-600">{categoryStats.工作}</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-purple-600" />
                    <div className="font-medium text-sm md:text-base">学习</div>
                    <div className="text-xl md:text-2xl font-bold text-purple-600">{categoryStats.学习}</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                    <FileText className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-600" />
                    <div className="font-medium text-sm md:text-base">其他</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-600">{categoryStats.其他}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">创建笔记</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button onClick={() => setActiveTab("notes")} className="w-full" size="lg">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    新建笔记
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">上传文档</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button onClick={() => setActiveTab("documents")} className="w-full" size="lg" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    上传文档
                  </Button>
                </CardContent>
              </Card>
            </div>

            {isMobile && (
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    月度报告
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button onClick={generateMonthlyReport} disabled={isGeneratingReport} className="w-full">
                    {isGeneratingReport ? "生成中..." : "生成本月报告"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            {selectedNote ? (
              <NoteView noteId={selectedNote} onBack={handleBackFromNote} />
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-bold">我的笔记</h2>

                  <div className="flex flex-col md:flex-row gap-4">
                    {/* 搜索框 */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="搜索笔记..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* 分类过滤 - 移动端下拉菜单 */}
                    {isMobile ? (
                      <div className="relative">
                        <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                          className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="全部">全部分类</option>
                          <option value="日常">日常</option>
                          <option value="工作">工作</option>
                          <option value="学习">学习</option>
                          <option value="其他">其他</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {["全部", "日常", "工作", "学习", "其他"].map((category) => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <NoteEditor userId={user.id} onNoteCreated={handleNoteCreated} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => (
                      <Card
                        key={note.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleNoteClick(note.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{note.title}</h3>
                            <Badge variant="outline">{note.category}</Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{note.summary}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {note.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            <Badge
                              variant={
                                note.priority === "高"
                                  ? "destructive"
                                  : note.priority === "中"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              <Star className="w-3 h-3 mr-1" />
                              {note.priority}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center p-8 text-gray-500">
                      {searchQuery ? "没有找到匹配的笔记" : "还没有笔记，开始创建吧！"}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {selectedDocument ? (
              <DocumentView documentId={selectedDocument} onBack={handleBackFromDocument} />
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-bold">我的文档</h2>

                  <div className="flex flex-col md:flex-row gap-4">
                    {/* 搜索框 */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="搜索文档..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* 分类过滤 - 移动端下拉菜单 */}
                    {isMobile ? (
                      <div className="relative">
                        <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                          className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="全部">全部分类</option>
                          <option value="日常">日常</option>
                          <option value="工作">工作</option>
                          <option value="学习">学习</option>
                          <option value="其他">其他</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {["全部", "日常", "工作", "学习", "其他"].map((category) => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DocumentUpload userId={user.id} onDocumentUploaded={handleDocumentUploaded} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <Card
                        key={doc.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleDocumentClick(doc.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{doc.title}</h3>
                            <Badge variant="outline">{doc.category}</Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{doc.fileName}</p>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{doc.summary}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {doc.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            <Badge variant="outline">{doc.documentType}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center p-8 text-gray-500">
                      {searchQuery ? "没有找到匹配的文档" : "还没有文档，开始上传吧！"}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">月度报告</h2>
              <Button onClick={generateMonthlyReport} disabled={isGeneratingReport} size="lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                {isGeneratingReport ? "生成中..." : "生成本月报告"}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>月报功能说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-2">📊 数据统计</h3>
                  <p className="text-sm text-gray-700">自动统计本月的笔记和文档数量，分析各分类的分布情况</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium mb-2">💡 智能洞察</h3>
                  <p className="text-sm text-gray-700">AI分析您的内容，提供深度洞察和改进建议</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium mb-2">🎯 行动计划</h3>
                  <p className="text-sm text-gray-700">基于本月数据，为下月制定具体的行动计划</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-medium mb-2">📝 自动同步</h3>
                  <p className="text-sm text-gray-700">生成的月报会自动同步到您的Notion数据库</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">设置</h2>

            <NotionSetup userId={user.id} />

            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>姓名</Label>
                  <Input value={user.name} disabled />
                </div>
                <div>
                  <Label>邮箱</Label>
                  <Input value={user.email} disabled />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem("token")
                    localStorage.removeItem("user")
                    // 清除所有 Notion 授权缓存
                    Object.keys(localStorage).forEach((key) => {
                      if (key.startsWith("notion_auth_")) {
                        localStorage.removeItem(key)
                      }
                    })
                    window.location.href = "/auth"
                  }}
                >
                  退出登录
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
