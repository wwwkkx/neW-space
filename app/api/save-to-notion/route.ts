export async function POST(req: Request) {
  try {
    const { report, notionToken, databaseId } = await req.json()

    if (!notionToken || !databaseId) {
      return Response.json(
        {
          error: "缺少Notion Token或数据库ID，请重新授权。",
        },
        { status: 400 },
      )
    }

    // 格式化数据库 ID
    let formattedDatabaseId = databaseId.replace(/-/g, "")
    if (formattedDatabaseId.length === 32) {
      formattedDatabaseId = [
        formattedDatabaseId.slice(0, 8),
        formattedDatabaseId.slice(8, 12),
        formattedDatabaseId.slice(12, 16),
        formattedDatabaseId.slice(16, 20),
        formattedDatabaseId.slice(20, 32),
      ].join("-")
    }

    console.log("Saving to Notion database:", formattedDatabaseId)

    // 首先检查数据库是否存在和可访问
    const checkResponse = await fetch(`https://api.notion.com/v1/databases/${formattedDatabaseId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
    })

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json()
      return Response.json(
        {
          error: `无法访问数据库: ${errorData.message}`,
          suggestion: "请确保 Notion 集成已被添加到该数据库",
        },
        { status: checkResponse.status },
      )
    }

    const database = await checkResponse.json()
    console.log("Database properties:", Object.keys(database.properties))

    // 创建页面的数据结构
    const pageData = {
      parent: {
        database_id: formattedDatabaseId,
      },
      properties: {},
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "故事叙述" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: report.narrative } }],
          },
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "原始聊天记录" } }],
          },
        },
        {
          object: "block",
          type: "code",
          code: {
            rich_text: [{ type: "text", text: { content: report.originalChat } }],
            language: "plain text",
          },
        },
      ],
    }

    // 根据数据库现有属性动态构建 properties
    const dbProperties = database.properties

    // 查找标题属性（通常是 title 类型）
    const titleProperty = Object.keys(dbProperties).find((key) => dbProperties[key].type === "title")

    if (titleProperty) {
      pageData.properties[titleProperty] = {
        title: [
          {
            text: {
              content: `${report.date} - ${report.friend}`,
            },
          },
        ],
      }
    }

    // 查找其他可能的属性
    Object.keys(dbProperties).forEach((propertyName) => {
      const property = dbProperties[propertyName]

      if (property.type === "rich_text" && propertyName.includes("朋友")) {
        pageData.properties[propertyName] = {
          rich_text: [{ text: { content: report.friend } }],
        }
      } else if (property.type === "date" && propertyName.includes("日期")) {
        pageData.properties[propertyName] = {
          date: { start: new Date().toISOString().split("T")[0] },
        }
      } else if (property.type === "multi_select" && propertyName.includes("情感")) {
        pageData.properties[propertyName] = {
          multi_select: report.emotions.map((emotion) => ({ name: emotion })),
        }
      }
    })

    console.log("Creating page with data:", JSON.stringify(pageData, null, 2))

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(pageData),
    })

    console.log("Notion API response status:", response.status)

    if (response.ok) {
      const result = await response.json()
      console.log("Successfully saved to Notion:", result.id)
      return Response.json({ success: true, pageId: result.id })
    } else {
      const errorData = await response.json()
      console.error("Notion API error:", errorData)
      return Response.json(
        {
          error: `保存失败: ${errorData.message}`,
          details: errorData,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Error saving to Notion:", error)
    return Response.json({ error: "保存到 Notion 时发生错误" }, { status: 500 })
  }
}
