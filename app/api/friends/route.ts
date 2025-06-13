import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const FriendProfileSchema = z.object({
  name: z.string().describe("朋友的名字或备注名"),
  personality: z.string().describe("性格特点描述"),
  relationshipType: z.string().describe("关系类型：朋友、同事、家人等"),
  commonTopics: z.array(z.string()).describe("常聊话题"),
  communicationStyle: z.string().describe("沟通风格"),
  emotionalTone: z.string().describe("情感基调"),
})

export async function POST(req: Request) {
  try {
    const { friendName, chatHistory } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json({ error: "DeepSeek API key not configured" }, { status: 400 })
    }

    // 生成朋友画像
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: FriendProfileSchema,
      prompt: `
基于以下聊天记录，分析并生成朋友的个性画像：

朋友姓名：${friendName}
聊天记录：
${chatHistory}

请分析这位朋友的：
1. 性格特点
2. 关系类型
3. 常聊话题
4. 沟通风格
5. 情感基调

请用中文回复，分析要准确且有温度。
      `,
    })

    return Response.json({
      success: true,
      profile: object,
    })
  } catch (error) {
    console.error("Error generating friend profile:", error)
    return Response.json({ error: "Failed to generate friend profile" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const friendName = searchParams.get("name")

    if (!friendName) {
      return Response.json({ error: "Friend name is required" }, { status: 400 })
    }

    // 这里应该从数据库获取朋友信息
    // 暂时返回模拟数据
    const friendData = {
      name: friendName,
      totalChats: 15,
      lastChatDate: "2024-01-15",
      emotionalTrends: ["温馨", "欢乐", "回忆"],
      commonTopics: ["工作", "生活", "旅行"],
    }

    return Response.json(friendData)
  } catch (error) {
    console.error("Error fetching friend data:", error)
    return Response.json({ error: "Failed to fetch friend data" }, { status: 500 })
  }
}
