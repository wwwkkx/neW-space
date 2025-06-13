"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Tag, Calendar, Edit, Save, ArrowLeft, Trash2, Star } from "lucide-react"

interface NoteViewProps {
  noteId: string
  onBack: () => void
}

export function NoteView({ noteId, onBack }: NoteViewProps) {
  const [note, setNote] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState("")

  useEffect(() => {
    fetchNote()
  }, [noteId])

  const fetchNote = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/notes/${noteId}`)
      if (response.ok) {
        const data = await response.json()
        setNote(data)
        setEditedContent(data.originalContent || "")
      } else {
        console.error("Failed to fetch note")
      }
    } catch (error) {
      console.error("Error fetching note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      })

      if (response.ok) {
        setIsEditing(false)
        fetchNote() // 重新获取更新后的笔记
      } else {
        alert("保存失败，请重试")
      }
    } catch (error) {
      console.error("Error saving note:", error)
      alert("保存失败，请重试")
    }
  }

  const handleDelete = async () => {
    if (!confirm("确定要删除这个笔记吗？此操作无法撤销。")) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("笔记已删除")
        onBack()
      } else {
        alert("删除失败，请重试")
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      alert("删除失败，请重试")
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
          </div>
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>
    )
  }

  if (!note) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">笔记不存在或已被删除</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <CardTitle className="text-xl md:text-2xl mb-2">{note.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline">{note.category}</Badge>
            <Badge variant={note.priority === "高" ? "destructive" : note.priority === "中" ? "default" : "secondary"}>
              <Star className="w-3 h-3 mr-1" />
              {note.priority}
            </Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(note.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          {isEditing ? (
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-1" />
              编辑
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 笔记摘要 */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2">📝 摘要</h3>
          <p className="text-gray-700">{note.summary}</p>
        </div>

        {/* 行动项 */}
        {note.actionItems && note.actionItems.length > 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium mb-2">✅ 行动项</h3>
            <ul className="list-disc list-inside space-y-1">
              {note.actionItems.map((item: string, index: number) => (
                <li key={index} className="text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 深度洞察 */}
        {note.insights && note.insights.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium mb-2">💡 深度洞察</h3>
            <ul className="list-disc list-inside space-y-1">
              {note.insights.map((insight: string, index: number) => (
                <li key={index} className="text-gray-700">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 原始内容 */}
        <div className="border rounded-lg">
          <div className="bg-gray-50 p-3 border-b">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              <h3 className="font-medium">原始内容</h3>
            </div>
          </div>
          <div className="p-4">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm font-mono">{note.originalContent}</pre>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">
          创建时间: {new Date(note.createdAt).toLocaleString()}
          {note.updatedAt !== note.createdAt && (
            <span className="ml-4">更新时间: {new Date(note.updatedAt).toLocaleString()}</span>
          )}
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存更改</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
