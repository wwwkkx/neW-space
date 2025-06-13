export async function POST() {
  try {
    const notionApiKey = process.env.NOTION_API_KEY

    if (!notionApiKey) {
      return Response.json({ error: "Notion API key 未配置" }, { status: 400 })
    }

    // 创建一个新的数据库
    const response = await fetch("https://api.notion.com/v1/databases", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: {
          type: "page_id",
          page_id: "root", // 这里需要一个页面ID作为父页面
        },
        title: [
          {
            type: "text",
            text: {
              content: "微信聊天日记",
            },
          },
        ],
        properties: {
          标题: {
            title: {},
          },
          朋友: {
            rich_text: {},
          },
          日期: {
            date: {},
          },
          情感标签: {
            multi_select: {
              options: [
                { name: "温馨", color: "pink" },
                { name: "欢乐", color: "yellow" },
                { name: "回忆", color: "blue" },
                { name: "争论", color: "red" },
                { name: "友谊", color: "green" },
                { name: "思念", color: "purple" },
                { name: "感动", color: "orange" },
              ],
            },
          },
          状态: {
            select: {
              options: [
                { name: "已保存", color: "green" },
                { name: "待编辑", color: "yellow" },
                { name: "已归档", color: "gray" },
              ],
            },
          },
        },
      }),
    })

    if (response.ok) {
      const database = await response.json()
      return Response.json({
        success: true,
        database: {
          id: database.id,
          url: database.url,
          title: database.title,
        },
      })
    } else {
      const errorData = await response.json()
      return Response.json({ error: `创建数据库失败: ${errorData.message}` }, { status: response.status })
    }
  } catch (error) {
    console.error("Error creating database:", error)
    return Response.json({ error: "创建数据库时发生错误" }, { status: 500 })
  }
}
