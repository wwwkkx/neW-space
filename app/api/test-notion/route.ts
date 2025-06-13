export async function GET() {
  try {
    const notionApiKey = process.env.NOTION_API_KEY
    const databaseId = process.env.NOTION_DATABASE_ID

    if (!notionApiKey || !databaseId) {
      return Response.json(
        {
          error: "Notion API key 或 Database ID 未配置",
          configured: { apiKey: !!notionApiKey, databaseId: !!databaseId },
        },
        { status: 400 },
      )
    }

    console.log("Testing Notion connection...")
    console.log("Original Database ID:", databaseId)

    // 格式化数据库 ID - 确保正确的 UUID 格式
    let formattedDatabaseId = databaseId.replace(/-/g, "")

    // 如果长度是32位，添加连字符形成标准 UUID 格式
    if (formattedDatabaseId.length === 32) {
      formattedDatabaseId = [
        formattedDatabaseId.slice(0, 8),
        formattedDatabaseId.slice(8, 12),
        formattedDatabaseId.slice(12, 16),
        formattedDatabaseId.slice(16, 20),
        formattedDatabaseId.slice(20, 32),
      ].join("-")
    }

    console.log("Formatted Database ID:", formattedDatabaseId)

    // 首先尝试获取数据库信息
    const response = await fetch(`https://api.notion.com/v1/databases/${formattedDatabaseId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
    })

    console.log("Notion test response status:", response.status)

    if (response.ok) {
      const database = await response.json()
      return Response.json({
        success: true,
        database: {
          id: database.id,
          title: database.title,
          properties: Object.keys(database.properties),
        },
        message: "✅ Notion 数据库连接成功！",
      })
    } else {
      const errorData = await response.json()
      console.error("Notion test error:", errorData)

      let errorMessage = "连接失败"
      let suggestions = []

      if (errorData.code === "object_not_found") {
        errorMessage = "数据库未找到"
        suggestions = [
          "1. 确认数据库 ID 是否正确",
          "2. 确保 Notion 集成已被添加到该数据库",
          "3. 检查数据库是否存在且可访问",
        ]
      } else if (errorData.code === "unauthorized") {
        errorMessage = "权限不足"
        suggestions = ["1. 检查 API Token 是否正确", "2. 确保集成有访问数据库的权限"]
      }

      return Response.json(
        {
          error: errorMessage,
          details: errorData.message,
          suggestions,
          code: errorData.code,
          databaseId: formattedDatabaseId,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Error testing Notion:", error)
    return Response.json({ error: "测试 Notion 连接时发生网络错误" }, { status: 500 })
  }
}
