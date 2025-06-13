// 使用Web Crypto API代替Node.js的crypto模块
async function hashPassword(password: string): Promise<string> {
  // 将密码字符串转换为Uint8Array
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  // 使用SHA-256算法创建哈希
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)

  // 将哈希值转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}

// 模拟用户数据库（需要与注册API共享）
// 在实际应用中，这应该是真实的数据库
const users: any[] = []

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    console.log("Login attempt:", { email })

    if (!email || !password) {
      return Response.json({ error: "邮箱和密码都是必填的" }, { status: 400 })
    }

    // 查找用户
    const user = users.find((u) => u.email === email)
    if (!user) {
      return Response.json({ error: "用户不存在" }, { status: 400 })
    }

    // 验证密码
    const hashedPassword = await hashPassword(password)
    if (hashedPassword !== user.password) {
      return Response.json({ error: "密码错误" }, { status: 400 })
    }

    console.log("Login successful:", user.id)

    // 生成简单的token (在生产环境中应使用更安全的方法)
    const token = btoa(
      JSON.stringify({ userId: user.id, email: user.email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
    )

    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        notionConnected: !!(user.notionToken && user.notionDatabaseId),
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return Response.json({ error: "登录失败，请重试" }, { status: 500 })
  }
}
