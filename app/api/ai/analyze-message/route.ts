import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const DiaryAnalysisSchema = z.object({
  title: z.string().describe("日记标题，简洁有吸引力"),
  summary: z.string().describe("内容摘要，提炼核心要点"),
  emotion: z.string().describe("主要情绪：开心、平静、思考、焦虑、兴奋、感动等"),
  keywords: z.array(z.string()).describe("关键词标签，3-5个"),
  category: z.string().describe("分类：生活、工作、学习、感悟、计划等"),
  mood_score: z.number().min(1).max(10).describe("心情指数，1-10分"),
  structured_content: z.string().describe("结构化内容，将原文优化为更好的日记格式"),
  insights: z.array(z.string()).describe("深度洞察，从内容中提取的思考点"),
})

export async function POST(req: Request) {
  try {
    const { userId, content, timestamp } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json({ error: "DeepSeek API key not configured" }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return Response.json({ error: "Content is required" }, { status: 400 })
    }

    console.log(`Analyzing message for user ${userId}:`, content.substring(0, 100))

    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: DiaryAnalysisSchema,
      prompt: `
请分析以下用户发送的文字内容，将其转化为结构化的日记记录：

用户内容：
${content}

发送时间：${timestamp}

要求：
1. 生成一个吸引人的日记标题
2. 提炼内容的核心摘要
3. 识别主要情绪和心情指数
4. 提取3-5个关键词标签
5. 确定内容分类
6. 将原文优化为更好的日记格式
7. 提供深度洞察和思考点

请用中文回复，内容要有温度和深度。
      `,
    })

    const analysis = {
      ...object,
      original_content: content,
      user_id: userId,
      created_at: timestamp,
      processed_at: new Date().toISOString(),
    }

    console.log("Analysis completed:", analysis.title)

    return Response.json(analysis)
  } catch (error) {
    console.error("Error analyzing message:", error)
    return Response.json({ error: "Failed to analyze message" }, { status: 500 })
  }
}
