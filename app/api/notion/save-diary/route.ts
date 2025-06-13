export async function POST(req: Request) {
  try {
    const { userId, analysis, userAuth } = await req.json()

    if (!userAuth.notionToken || !userAuth.databaseId) {
      return Response.json({ error: "User Notion auth not found" }, { status: 400 })
    }

    console.log(`Saving diary to Notion for user ${userId}`)

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userAuth.notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: {
          database_id: userAuth.databaseId,
        },
        properties: {
          标题: {
            title: [{ text: { content: analysis.title } }],
          },
          分类: {
            select: { name: analysis.category },
          },
          情绪: {
            select: { name: analysis.emotion },
          },
          心情指数: {
            number: analysis.mood_score,
          },
          关键词: {
            multi_select: analysis.keywords.map((keyword: string) => ({ name: keyword })),
          },
          日期: {
            date: { start: analysis.created_at.split("T")[0] },
          },
          来源: {
            select: { name: "微信" },
          },
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "📝 内容摘要" } }],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: analysis.summary } }],
            },
          },
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "✨ 结构化内容" } }],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: analysis.structured_content } }],
            },
          },
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "💭 深度洞察" } }],
            },
          },
          ...analysis.insights.map((insight: string) => ({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ text: { content: insight } }],
            },
          })),
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "📱 原始内容" } }],
            },
          },
          {
            object: "block",
            type: "quote",
            quote: {
              rich_text: [{ text: { content: analysis.original_content } }],
            },
          },
        ],
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log("Successfully saved to Notion:", result.id)
      return Response.json({ success: true, pageId: result.id })
    } else {
      const errorData = await response.json()
      console.error("Notion API error:", errorData)
      return Response.json({ error: `Notion save failed: ${errorData.message}` }, { status: response.status })
    }
  } catch (error) {
    console.error("Error saving to Notion:", error)
    return Response.json({ error: "Failed to save to Notion" }, { status: 500 })
  }
}
