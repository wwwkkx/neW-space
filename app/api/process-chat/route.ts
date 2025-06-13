import { createOpenAI } from "@ai-sdk/openai"
import { generateObject, generateText } from "ai"
import { z } from "zod"

// 创建 DeepSeek 客户端
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const ChatAnalysisSchema = z.object({
  friend: z.string().describe("朋友的名字或备注名"),
  narrative: z.string().describe("将聊天记录转化为第三人称叙述的温暖故事"),
  emotions: z.array(z.string()).describe("情感标签，如：温馨、回忆、争论、欢乐等"),
  messages: z
    .array(
      z.object({
        sender: z.string(),
        time: z.string(),
        content: z.string(),
      }),
    )
    .describe("解析后的聊天消息"),
})

// 解析聊天记录的辅助函数
function parseChatMessages(chatContent: string) {
  const lines = chatContent.split("\n").filter((line) => line.trim())
  const messages = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // 尝试匹配 "姓名 时间" 格式
    const match = line.match(/^(.+?)\s+(\d{1,2}:\d{2})/)
    if (match) {
      const sender = match[1]
      const time = match[2]
      // 获取下一行作为消息内容
      const content = i + 1 < lines.length ? lines[i + 1].trim() : ""
      if (content) {
        messages.push({ sender, time, content })
        i++ // 跳过下一行，因为已经作为内容处理了
      }
    } else {
      // 如果不匹配格式，尝试简单解析
      const parts = line.split(/\s+/)
      if (parts.length >= 2) {
        const sender = parts[0]
        const time = parts[1]
        const content = parts.slice(2).join(" ")
        if (content) {
          messages.push({ sender, time, content })
        }
      }
    }
  }

  return messages
}

export async function POST(req: Request) {
  try {
    // 检查 DeepSeek API key 是否配置
    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json(
        {
          error: "DeepSeek API key is not configured. Please add DEEPSEEK_API_KEY to your environment variables.",
        },
        { status: 400 },
      )
    }

    const { chatContent } = await req.json()

    // 验证输入
    if (!chatContent || chatContent.trim().length === 0) {
      return Response.json({ error: "Chat content is required" }, { status: 400 })
    }

    console.log("Processing chat content:", chatContent.substring(0, 200) + "...")

    try {
      // 首先尝试使用 generateObject
      const { object } = await generateObject({
        model: deepseek("deepseek-chat"),
        schema: ChatAnalysisSchema,
        prompt: `
请分析以下微信聊天记录，并生成一份温暖的日记报告。

聊天记录：
${chatContent}

请严格按照以下JSON格式返回：
{
  "friend": "朋友的名字",
  "narrative": "第三人称温暖叙述",
  "emotions": ["情感标签1", "情感标签2", "情感标签3"],
  "messages": [
    {
      "sender": "发送者",
      "time": "时间",
      "content": "消息内容"
    }
  ]
}

要求：
1. 识别聊天中的朋友名字（优先使用备注名）
2. 将聊天内容转化为第三人称的温暖叙述，像在讲述一个故事
3. 分析对话中的情感主题，提供3-5个情感标签
4. 解析出每条消息的发送者、时间和内容
5. 叙述要有温度，体现朋友间的情感和互动

请用中文回复。
        `,
      })

      const report = {
        date: new Date().toLocaleDateString("zh-CN"),
        friend: object.friend,
        originalChat: chatContent,
        narrative: object.narrative,
        emotions: object.emotions,
        messages: object.messages,
      }

      return Response.json(report)
    } catch (structuredError) {
      console.log("Structured generation failed, trying text generation:", structuredError)

      // 如果结构化生成失败，使用文本生成作为备选方案
      const { text } = await generateText({
        model: deepseek("deepseek-chat"),
        prompt: `
请分析以下微信聊天记录，并生成一份温暖的日记报告：

聊天记录：
${chatContent}

请按照以下格式回复：
朋友名字：[朋友的名字]
故事叙述：[第三人称温暖叙述]
情感标签：[标签1,标签2,标签3]

要求：
1. 识别聊天中的朋友名字
2. 将聊天内容转化为第三人称的温暖叙述
3. 分析对话中的情感主题，提供3-5个情感标签

请用中文回复。
        `,
      })

      // 解析文本响应
      const lines = text.split("\n")
      let friend = "未知朋友"
      let narrative = "这是一段温暖的对话。"
      let emotions = ["温馨"]

      for (const line of lines) {
        if (line.includes("朋友名字：")) {
          friend = line.replace("朋友名字：", "").trim()
        } else if (line.includes("故事叙述：")) {
          narrative = line.replace("故事叙述：", "").trim()
        } else if (line.includes("情感标签：")) {
          const emotionText = line.replace("情感标签：", "").trim()
          emotions = emotionText
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e)
        }
      }

      // 解析聊天消息
      const messages = parseChatMessages(chatContent)

      const report = {
        date: new Date().toLocaleDateString("zh-CN"),
        friend,
        originalChat: chatContent,
        narrative,
        emotions,
        messages,
      }

      return Response.json(report)
    }
  } catch (error) {
    console.error("Error processing chat:", error)

    // 处理特定的 DeepSeek 错误
    if (error instanceof Error) {
      console.error("Error details:", error.message)

      if (error.message.includes("API key")) {
        return Response.json(
          { error: "DeepSeek API key is missing or invalid. Please check your configuration." },
          { status: 401 },
        )
      }
      if (error.message.includes("quota") || error.message.includes("limit")) {
        return Response.json({ error: "DeepSeek API quota exceeded. Please check your usage limits." }, { status: 429 })
      }
      if (error.message.includes("Invalid JSON")) {
        return Response.json({ error: "API response format error. Please try again." }, { status: 500 })
      }
    }

    // 作为最后的备选方案，返回基本解析结果
    try {
      const messages = parseChatMessages(req.body?.chatContent || "")
      const friend = messages.length > 0 ? messages[0].sender : "未知朋友"

      const report = {
        date: new Date().toLocaleDateString("zh-CN"),
        friend,
        originalChat: req.body?.chatContent || "",
        narrative: "今天和朋友进行了一段有意义的对话，虽然无法生成详细分析，但这段对话记录了美好的时光。",
        emotions: ["温馨", "友谊"],
        messages,
      }

      return Response.json(report)
    } catch (fallbackError) {
      return Response.json({ error: "Failed to process chat. Please try again later." }, { status: 500 })
    }
  }
}
