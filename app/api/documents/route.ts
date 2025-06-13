import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const DocumentAnalysisSchema = z.object({
  title: z.string().describe("文档标题"),
  summary: z.string().describe("文档摘要，控制在200字以内"),
  category: z.enum(["日常", "工作", "学习", "其他"]).describe("文档分类"),
  tags: z.array(z.string()).describe("关键词标签"),
  keyPoints: z.array(z.string()).describe("关键要点，3-5个"),
  actionItems: z.array(z.string()).describe("可执行的行动项"),
  documentType: z.string().describe("文档类型：报告、方案、笔记、资料等"),
})

// 模拟文档数据库
const documents: any[] = []

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return Response.json({ error: "文件和用户ID都是必填的" }, { status: 400 })
    }

    // 增加文件大小限制到 25MB
    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: "文件大小不能超过 25MB" }, { status: 400 })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json({ error: "AI服务未配置" }, { status: 500 })
    }

    // 读取文件内容
    const content = await file.text()

    // 增加内容长度限制
    if (content.length > 200000) {
      return Response.json({ error: "文件内容过长，请上传小于200KB的文件" }, { status: 400 })
    }

    console.log(`Analyzing document for user ${userId}`)

    // AI分析文档内容
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: DocumentAnalysisSchema,
      prompt: `
请分析以下文档内容，将其结构化处理：

文档名称：${file.name}
文档内容：
${content}

要求：
1. 生成合适的文档标题
2. 写一个200字以内的摘要
3. 确定文档分类（日常、工作、学习、其他）
4. 提取关键词标签
5. 总结3-5个关键要点
6. 识别可执行的行动项
7. 判断文档类型

请用中文回复，分析要准确且实用。
      `,
    })

    // 创建文档记录
    const document = {
      id: Date.now().toString(),
      userId,
      fileName: file.name,
      fileSize: file.size,
      originalContent: content,
      ...object,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    documents.push(document)

    console.log(`Document created with ID: ${document.id}`)

    // 保存到Notion（如果用户已授权）
    try {
      await saveDocumentToNotion(userId, document)
    } catch (error) {
      console.error("Failed to save document to Notion:", error)
    }

    return Response.json({
      success: true,
      document: {
        ...document,
        originalContent: undefined, // 不返回原始内容以节省带宽
      },
    })
  } catch (error) {
    console.error("Error processing document:", error)
    return Response.json({ error: "处理文档失败" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const category = searchParams.get("category")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!userId) {
      return Response.json({ error: "用户ID是必填的" }, { status: 400 })
    }

    // 过滤用户的文档
    let userDocuments = documents.filter((doc) => doc.userId === userId)

    // 按分类过滤
    if (category && category !== "全部") {
      userDocuments = userDocuments.filter((doc) => doc.category === category)
    }

    // 按时间排序
    userDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedDocuments = userDocuments.slice(startIndex, endIndex)

    // 移除原始内容以节省带宽
    const documentsWithoutContent = paginatedDocuments.map((doc) => ({
      ...doc,
      originalContent: undefined,
    }))

    return Response.json({
      documents: documentsWithoutContent,
      total: userDocuments.length,
      page,
      totalPages: Math.ceil(userDocuments.length / limit),
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return Response.json({ error: "获取文档失败" }, { status: 500 })
  }
}

async function saveDocumentToNotion(userId: string, document: any) {
  // 这里应该从数据库获取用户的Notion配置并保存文档
  console.log("Saving document to Notion for user:", userId)
}
