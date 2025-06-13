import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const MonthlySummarySchema = z.object({
  totalChats: z.number().describe("本月聊天记录总数"),
  topFriends: z
    .array(
      z.object({
        name: z.string(),
        chatCount: z.number(),
        mainTopics: z.array(z.string()),
        emotionalTone: z.string(),
      }),
    )
    .describe("聊天最多的朋友"),
  emotionalTrends: z
    .array(
      z.object({
        emotion: z.string(),
        frequency: z.number(),
        description: z.string(),
      }),
    )
    .describe("情感趋势分析"),
  highlights: z.array(z.string()).describe("本月重要时刻"),
  wordCloud: z
    .array(
      z.object({
        word: z.string(),
        frequency: z.number(),
      }),
    )
    .describe("高频词汇"),
  summary: z.string().describe("月度总结文字"),
  insights: z.array(z.string()).describe("深度洞察"),
})

export async function POST(req: Request) {
  try {
    const { month, year, reports } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json({ error: "DeepSeek API key not configured" }, { status: 400 })
    }

    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: MonthlySummarySchema,
      prompt: `
请基于以下${year}年${month}月的聊天记录生成月度总结报告：

聊天记录数据：
${JSON.stringify(reports, null, 2)}

要求：
1. 统计聊天频率和朋友互动情况
2. 分析情感变化趋势和模式
3. 提取重要时刻和话题
4. 生成词云数据
5. 写一段温暖的月度总结
6. 提供深度洞察和建议

请用中文回复，内容要有温度和深度。
      `,
    })

    // 保存月度总结到 Notion
    await saveMonthlyToNotion(year, month, object)

    return Response.json(object)
  } catch (error) {
    console.error("Error generating monthly summary:", error)
    return Response.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}

async function saveMonthlyToNotion(year: number, month: number, summary: any) {
  try {
    const notionApiKey = process.env.NOTION_API_KEY
    const databaseId = process.env.NOTION_DATABASE_ID

    if (!notionApiKey || !databaseId) return

    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          标题: {
            title: [{ text: { content: `${year}年${month}月总结` } }],
          },
          类型: {
            select: { name: "月度总结" },
          },
          日期: {
            date: { start: `${year}-${month.toString().padStart(2, "0")}-01` },
          },
        },
        children: [
          {
            object: "block",
            type: "heading_1",
            heading_1: {
              rich_text: [{ text: { content: `${year}年${month}月聊天总结` } }],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: summary.summary } }],
            },
          },
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "数据统计" } }],
            },
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ text: { content: `总聊天记录：${summary.totalChats} 条` } }],
            },
          },
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "重要时刻" } }],
            },
          },
          ...summary.highlights.map((highlight: string) => ({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ text: { content: highlight } }],
            },
          })),
        ],
      }),
    })
  } catch (error) {
    console.error("Error saving monthly summary to Notion:", error)
  }
}
