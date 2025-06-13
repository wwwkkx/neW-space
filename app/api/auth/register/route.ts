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

// 模拟用户数据库（实际应该使用真实数据库）
const users: any[] = []

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    console.log("Registration attempt:", { email, name })

    if (!email || !password || !name) {
      return Response.json({ error: "所有字段都是必填的" }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: "密码至少需要6位字符" }, { status: 400 })
    }

    // 检查用户是否已存在
    const existingUser = users.find((user) => user.email === email)
    if (existingUser) {
      return Response.json({ error: "用户已存在" }, { status: 400 })
    }

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 创建新用户
    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      notionToken: null,
      notionDatabaseId: null,
    }

    users.push(newUser)
    console.log("User created successfully:", newUser.id)

    // 生成简单的token (在生产环境中应使用更安全的方法)
    const token = btoa(
      JSON.stringify({ userId: newUser.id, email: newUser.email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
    )

    return Response.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return Response.json({ error: "注册失败，请重试" }, { status: 500 })
  }
}
