import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const NoteAnalysisSchema = z.object({
  title: z.string().describe("笔记标题，简洁有吸引力"),
  summary: z.string().describe("内容摘要，提炼核心要点"),
  category: z.enum(["日常", "工作", "学习", "其他"]).describe("内容分类"),
  tags: z.array(z.string()).describe("关键词标签，3-5个"),
  priority: z.enum(["低", "中", "高"]).describe("重要程度"),
  actionItems: z.array(z.string()).describe("可执行的行动项"),
  insights: z.array(z.string()).describe("深度洞察和思考点"),
})

// 模拟笔记数据库
const notes: any[] = []

export async function POST(req: Request) {
  try {
    const { content, userId } = await req.json()

    if (!content || !userId) {
      return Response.json({ error: "内容和用户ID都是必填的" }, { status: 400 })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json({ error: "AI服务未配置" }, { status: 500 })
    }

    console.log(`Analyzing note for user ${userId}`)

    // AI分析笔记内容
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: NoteAnalysisSchema,
      prompt: `
请分析以下笔记内容，将其结构化处理：

笔记内容：
${content}

要求：
1. 生成一个简洁有吸引力的标题
2. 提炼内容的核心摘要
3. 确定内容分类（日常、工作、学习、其他）
4. 提取3-5个关键词标签
5. 评估重要程度（低、中、高）
6. 识别可执行的行动项
7. 提供深度洞察和思考点

请用中文回复，分析要准确且实用。
      `,
    })

    // 创建笔记记录
    const note = {
      id: Date.now().toString(),
      userId,
      originalContent: content,
      ...object,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    notes.push(note)

    // 保存到Notion（如果用户已授权）
    try {
      await saveToNotion(userId, note)
    } catch (error) {
      console.error("Failed to save to Notion:", error)
      // 不影响主流程，继续返回成功
    }

    return Response.json({
      success: true,
      note,
    })
  } catch (error) {
    console.error("Error creating note:", error)
    return Response.json({ error: "创建笔记失败" }, { status: 500 })
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

    // 过滤用户的笔记
    let userNotes = notes.filter((note) => note.userId === userId)

    // 按分类过滤
    if (category && category !== "全部") {
      userNotes = userNotes.filter((note) => note.category === category)
    }

    // 按时间排序
    userNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedNotes = userNotes.slice(startIndex, endIndex)

    return Response.json({
      notes: paginatedNotes,
      total: userNotes.length,
      page,
      totalPages: Math.ceil(userNotes.length / limit),
    })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return Response.json({ error: "获取笔记失败" }, { status: 500 })
  }
}

async function saveToNotion(userId: string, note: any) {
  // 这里应该从数据库获取用户的Notion配置
  // 暂时跳过Notion保存
  console.log("Saving note to Notion for user:", userId)
}
