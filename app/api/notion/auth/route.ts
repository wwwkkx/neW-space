// 使用更持久的存储方式
const userAuths = new Map<string, any>()

export async function POST(req: Request) {
  try {
    const { userId, notionToken, databaseId, workspaceName, workspaceId, botId, databaseName } = await req.json()

    if (!userId || !notionToken) {
      return Response.json({ error: "用户ID和Notion Token是必填的" }, { status: 400 })
    }

    // 保存用户授权信息
    const authData = {
      notionToken,
      databaseId,
      workspaceName,
      workspaceId,
      botId,
      databaseName,
      authorizedAt: new Date().toISOString(),
    }

    userAuths.set(userId, authData)

    console.log("Saving Notion auth for user:", userId, "Database ID:", databaseId)

    // 同时保存到 localStorage（客户端持久化）
    return Response.json({
      success: true,
      message: "Notion授权成功",
      authData, // 返回授权数据给客户端
    })
  } catch (error) {
    console.error("Error saving Notion auth:", error)
    return Response.json({ error: "保存Notion授权失败" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ error: "用户ID是必填的" }, { status: 400 })
    }

    // 获取用户授权信息
    const authData = userAuths.get(userId)

    if (authData) {
      return Response.json({
        authorized: true,
        ...authData,
      })
    } else {
      return Response.json({
        authorized: false,
        notionToken: null,
        databaseId: null,
      })
    }
  } catch (error) {
    console.error("Error checking Notion auth:", error)
    return Response.json({ error: "检查Notion授权失败" }, { status: 500 })
  }
}
