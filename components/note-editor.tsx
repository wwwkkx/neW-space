"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Sparkles } from "lucide-react"

interface NoteEditorProps {
  userId: string
  onNoteCreated: () => void
}

export function NoteEditor({ userId, onNoteCreated }: NoteEditorProps) {
  const [content, setContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateNote = async () => {
    if (!content.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          userId,
        }),
      })

      if (response.ok) {
        setContent("")
        onNoteCreated()
        alert("笔记创建成功！AI已自动分析并分类")
      } else {
        alert("创建笔记失败，请重试")
      }
    } catch (error) {
      alert("创建笔记失败，请重试")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          创建新笔记
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="在这里记录您的想法、灵感或任何内容...

AI会自动帮您：
• 生成合适的标题
• 提炼核心摘要
• 智能分类（日常/工作/学习/其他）
• 提取关键词标签
• 评估重要程度
• 识别行动项"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] resize-none"
        />
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">{content.length} 字符</div>
          <Button onClick={handleCreateNote} disabled={isCreating || !content.trim()}>
            <Sparkles className="w-4 h-4 mr-2" />
            {isCreating ? "AI分析中..." : "创建笔记"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
