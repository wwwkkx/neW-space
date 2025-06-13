import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const MonthlyReportSchema = z.object({
  title: z.string().describe("月报标题"),
  summary: z.string().describe("月度总结"),
  statistics: z
    .object({
      totalNotes: z.number(),
      totalDocuments: z.number(),
      categoryBreakdown: z.record(z.number()),
      mostActiveDay: z.string(),
    })
    .describe("统计数据"),
  highlights: z.array(z.string()).describe("本月亮点"),
  insights: z.array(z.string()).describe("深度洞察"),
  actionItems: z.array(z.string()).describe("下月行动计划"),
  categoryAnalysis: z
    .object({
      work: z.string().describe("工作方面分析"),
      study: z.string().describe("学习方面分析"),
      daily: z.string().describe("日常方面分析"),
    })
    .describe("分类分析"),
})

// 模拟数据库
const notes: any[] = []
const documents: any[] = []

export async function POST(req: Request) {
  try {
    const { userId, year, month } = await req.json()

    if (!userId || !year || !month) {
      return Response.json({ error: "用户ID、年份和月份都是必填的" }, { status: 400 })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json({ error: "AI服务未配置" }, { status: 500 })
    }

    // 获取指定月份的数据
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const monthlyNotes = notes.filter((note) => {
      const noteDate = new Date(note.createdAt)
      return note.userId === userId && noteDate >= startDate && noteDate <= endDate
    })

    const monthlyDocuments = documents.filter((doc) => {
      const docDate = new Date(doc.createdAt)
      return doc.userId === userId && docDate >= startDate && docDate <= endDate
    })

    console.log(`Generating monthly report for user ${userId}, ${year}-${month}`)

    // 准备数据摘要
    const dataForAnalysis = {
      notes: monthlyNotes.map((note) => ({
        title: note.title,
        category: note.category,
        tags: note.tags,
        summary: note.summary,
        date: note.createdAt,
      })),
      documents: monthlyDocuments.map((doc) => ({
        title: doc.title,
        category: doc.category,
        tags: doc.tags,
        summary: doc.summary,
        documentType: doc.documentType,
        date: doc.createdAt,
      })),
    }

    // AI生成月报
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: MonthlyReportSchema,
      prompt: `
请基于以下${year}年${month}月的数据生成月度报告：

笔记数据：
${JSON.stringify(dataForAnalysis.notes, null, 2)}

文档数据：
${JSON.stringify(dataForAnalysis.documents, null, 2)}

要求：
1. 生成月报标题
2. 写一个全面的月度总结
3. 统计各类数据
4. 提取本月亮点
5. 提供深度洞察
6. 制定下月行动计划
7. 分析各分类的情况

请用中文回复，内容要有深度和实用性。
      `,
    })

    // 补充统计数据
    const categoryBreakdown: Record<string, number> = {}
    ;[...monthlyNotes, ...monthlyDocuments].forEach((item) => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1
    })

    const report = {
      ...object,
      statistics: {
        totalNotes: monthlyNotes.length,
        totalDocuments: monthlyDocuments.length,
        categoryBreakdown,
        mostActiveDay: getMostActiveDay([...monthlyNotes, ...monthlyDocuments]),
      },
      year,
      month,
      userId,
      createdAt: new Date().toISOString(),
    }

    // 保存到Notion（如果用户已授权）
    try {
      await saveReportToNotion(userId, report)
    } catch (error) {
      console.error("Failed to save report to Notion:", error)
    }

    return Response.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("Error generating monthly report:", error)
    return Response.json({ error: "生成月报失败" }, { status: 500 })
  }
}

function getMostActiveDay(items: any[]): string {
  const dayCount: Record<string, number> = {}

  items.forEach((item) => {
    const date = new Date(item.createdAt).toISOString().split("T")[0]
    dayCount[date] = (dayCount[date] || 0) + 1
  })

  const mostActiveDay = Object.entries(dayCount).reduce((a, b) => (dayCount[a[0]] > dayCount[b[0]] ? a : b))?.[0]

  return mostActiveDay || "无数据"
}

async function saveReportToNotion(userId: string, report: any) {
  // 这里应该从数据库获取用户的Notion配置并保存月报
  console.log("Saving monthly report to Notion for user:", userId)
}
