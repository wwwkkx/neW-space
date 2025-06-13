export async function POST(req: Request) {
  try {
    // 从请求头获取Token
    const notionApiKey = req.headers.get("X-Notion-Token") || process.env.NOTION_API_KEY

    if (!notionApiKey) {
      return Response.json({ error: "Notion API key 未配置" }, { status: 400 })
    }

    // 首先获取用户的工作区信息
    const userResponse = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Notion-Version": "2022-06-28",
      },
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.json()
      return Response.json({ error: `无法获取用户信息: ${errorData.message}` }, { status: userResponse.status })
    }

    // 搜索现有的页面作为父页面
    const searchResponse = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          value: "page",
          property: "object",
        },
        page_size: 1,
      }),
    })

    let parentPageId = null

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.results && searchData.results.length > 0) {
        parentPageId = searchData.results[0].id
      }
    }

    // 如果没有找到页面，尝试创建到工作区根目录
    if (!parentPageId) {
      // 直接创建数据库到工作区
      const databaseResponse = await fetch("https://api.notion.com/v1/databases", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: {
            type: "workspace",
            workspace: true,
          },
          title: [
            {
              type: "text",
              text: {
                content: "智能笔记助手",
              },
            },
          ],
          properties: {
            标题: {
              title: {},
            },
            分类: {
              select: {
                options: [
                  { name: "日常", color: "blue" },
                  { name: "工作", color: "green" },
                  { name: "学习", color: "purple" },
                  { name: "其他", color: "gray" },
                ],
              },
            },
            标签: {
              multi_select: {
                options: [
                  { name: "重要", color: "red" },
                  { name: "待办", color: "yellow" },
                  { name: "已完成", color: "green" },
                  { name: "参考", color: "blue" },
                ],
              },
            },
            优先级: {
              select: {
                options: [
                  { name: "高", color: "red" },
                  { name: "中", color: "yellow" },
                  { name: "低", color: "gray" },
                ],
              },
            },
            创建日期: {
              date: {},
            },
            类型: {
              select: {
                options: [
                  { name: "笔记", color: "blue" },
                  { name: "文档", color: "green" },
                  { name: "月报", color: "purple" },
                ],
              },
            },
          },
        }),
      })

      if (databaseResponse.ok) {
        const database = await databaseResponse.json()
        return Response.json({
          success: true,
          database: {
            id: database.id,
            url: database.url,
            title: database.title,
          },
          message: "✅ 成功创建智能笔记助手数据库！",
        })
      } else {
        const errorData = await databaseResponse.json()
        return Response.json({ error: `创建数据库失败: ${errorData.message}` }, { status: databaseResponse.status })
      }
    }

    // 如果找到了页面，在页面下创建数据库
    const databaseResponse = await fetch("https://api.notion.com/v1/databases", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: {
          type: "page_id",
          page_id: parentPageId,
        },
        title: [
          {
            type: "text",
            text: {
              content: "智能笔记助手",
            },
          },
        ],
        properties: {
          标题: {
            title: {},
          },
          分类: {
            select: {
              options: [
                { name: "日常", color: "blue" },
                { name: "工作", color: "green" },
                { name: "学习", color: "purple" },
                { name: "其他", color: "gray" },
              ],
            },
          },
          标签: {
            multi_select: {
              options: [
                { name: "重要", color: "red" },
                { name: "待办", color: "yellow" },
                { name: "已完成", color: "green" },
                { name: "参考", color: "blue" },
              ],
            },
          },
          优先级: {
            select: {
              options: [
                { name: "高", color: "red" },
                { name: "中", color: "yellow" },
                { name: "低", color: "gray" },
              ],
            },
          },
          创建日期: {
            date: {},
          },
          类型: {
            select: {
              options: [
                { name: "笔记", color: "blue" },
                { name: "文档", color: "green" },
                { name: "月报", color: "purple" },
              ],
            },
          },
        },
      }),
    })

    if (databaseResponse.ok) {
      const database = await databaseResponse.json()
      return Response.json({
        success: true,
        database: {
          id: database.id,
          url: database.url,
          title: database.title,
        },
        message: "✅ 成功创建智能笔记助手数据库！",
      })
    } else {
      const errorData = await databaseResponse.json()
      return Response.json({ error: `创建数据库失败: ${errorData.message}` }, { status: databaseResponse.status })
    }
  } catch (error) {
    console.error("Error setting up Notion:", error)
    return Response.json({ error: "设置 Notion 时发生错误" }, { status: 500 })
  }
}
