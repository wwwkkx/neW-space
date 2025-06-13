export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 })
    }

    // 这里应该从数据库查询用户授权状态
    // 暂时使用模拟数据，实际应该连接数据库
    const userAuth = await getUserAuthFromDB(userId)

    return Response.json({
      authorized: !!userAuth,
      notionToken: userAuth?.notionToken,
      databaseId: userAuth?.databaseId,
      authorizedAt: userAuth?.authorizedAt,
    })
  } catch (error) {
    console.error("Error checking user auth status:", error)
    return Response.json({ error: "Failed to check auth status" }, { status: 500 })
  }
}

// 模拟数据库查询（实际应该连接真实数据库）
async function getUserAuthFromDB(userId: string) {
  // 这里应该查询数据库
  // 暂时返回null，表示用户未授权
  return null
}

export async function POST(req: Request) {
  try {
    const { userId, notionToken, databaseId } = await req.json()

    if (!userId || !notionToken || !databaseId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 这里应该保存到数据库
    await saveUserAuthToDB(userId, notionToken, databaseId)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error saving user auth:", error)
    return Response.json({ error: "Failed to save auth" }, { status: 500 })
  }
}

// 模拟数据库保存（实际应该连接真实数据库）
async function saveUserAuthToDB(userId: string, notionToken: string, databaseId: string) {
  // 这里应该保存到数据库
  console.log("Saving user auth:", { userId, databaseId })
}
