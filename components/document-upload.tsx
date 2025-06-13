"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Sparkles } from "lucide-react"

interface DocumentUploadProps {
  userId: string
  onDocumentUploaded: () => void
}

export function DocumentUpload({ userId, onDocumentUploaded }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // 检查文件类型
    const allowedTypes = [".txt", ".md", ".doc", ".docx", ".pdf"]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      alert("仅支持 .txt, .md, .doc, .docx, .pdf 格式的文件")
      return
    }

    // 检查文件大小 (25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert("文件大小不能超过 25MB")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        return newProgress >= 90 ? 90 : newProgress
      })
    }, 300)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId)

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        console.log("Document uploaded successfully:", result.document.id)
        onDocumentUploaded()
        alert("文档上传成功！AI已自动分析并分类")
      } else {
        const data = await response.json()
        alert(data.error || "上传文档失败，请重试")
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error("Upload error:", error)
      alert("上传文档失败，请重试")
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          上传文档
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-gray-400" />
          <div className="space-y-2">
            <p className="text-base md:text-lg font-medium">
              {isUploading ? "AI分析中..." : "拖拽文件到这里或点击上传"}
            </p>
            <p className="text-xs md:text-sm text-gray-500">支持 .txt, .md, .doc, .docx, .pdf 格式，最大 25MB</p>
          </div>

          {isUploading ? (
            <div className="mt-4 w-full">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{Math.round(uploadProgress)}% 完成</p>
            </div>
          ) : (
            <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
              <Sparkles className="w-4 h-4 mr-2" />
              选择文件
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.doc,.docx,.pdf"
            onChange={handleFileSelect}
          />
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2">AI会自动帮您：</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 生成文档标题和摘要</li>
            <li>• 智能分类和标签</li>
            <li>• 提取关键要点</li>
            <li>• 识别行动项</li>
            <li>• 判断文档类型</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
