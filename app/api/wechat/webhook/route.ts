import type { NextRequest } from "next/server"
import crypto from "crypto"

// 微信公众号配置
const WECHAT_TOKEN = process.env.WECHAT_TOKEN || "your_wechat_token"
const WECHAT_ENCODING_AES_KEY = process.env.WECHAT_ENCODING_AES_KEY
const WECHAT_APPID = process.env.WECHAT_APPID

// 验证微信服务器
function verifySignature(signature: string, timestamp: string, nonce: string): boolean {
  const tmpArr = [WECHAT_TOKEN, timestamp, nonce].sort()
  const tmpStr = tmpArr.join("")
  const hash = crypto.createHash("sha1").update(tmpStr).digest("hex")
  return hash === signature
}

// 解析XML消息
function parseXML(xml: string) {
  const msgTypeMatch = xml.match(/<MsgType><!\[CDATA\[(.+?)\]\]><\/MsgType>/)
  const contentMatch = xml.match(/<Content><!\[CDATA\[(.+?)\]\]><\/Content>/)
  const fromUserMatch = xml.match(/<FromUserName><!\[CDATA\[(.+?)\]\]><\/FromUserName>/)
  const toUserMatch = xml.match(/<ToUserName><!\[CDATA\[(.+?)\]\]><\/ToUserName>/)
  const createTimeMatch = xml.match(/<CreateTime>(\d+)<\/CreateTime>/)

  return {
    msgType: msgTypeMatch ? msgTypeMatch[1] : "",
    content: contentMatch ? contentMatch[1] : "",
    fromUser: fromUserMatch ? fromUserMatch[1] : "",
    toUser: toUserMatch ? toUserMatch[1] : "",
    createTime: createTimeMatch ? Number.parseInt(createTimeMatch[1]) : 0,
  }
}

// 创建回复XML
function createReplyXML(toUser: string, fromUser: string, content: string) {
  return `
    <xml>
      <ToUserName><![CDATA[${toUser}]]></ToUserName>
      <FromUserName><![CDATA[${fromUser}]]></FromUserName>
      <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
    </xml>
  `.trim()
}

// GET 请求 - 微信服务器验证
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const signature = searchParams.get("signature")
  const timestamp = searchParams.get("timestamp")
  const nonce = searchParams.get("nonce")
  const echostr = searchParams.get("echostr")

  if (!signature || !timestamp || !nonce || !echostr) {
    return new Response("Missing parameters", { status: 400 })
  }

  if (verifySignature(signature, timestamp, nonce)) {
    return new Response(echostr)
  } else {
    return new Response("Invalid signature", { status: 403 })
  }
}

// POST 请求 - 处理微信消息
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log("Received WeChat message:", body)

    const message = parseXML(body)
    const { msgType, content, fromUser, toUser } = message

    if (msgType === "text" && content) {
      // 检查用户是否已授权Notion
      const userAuth = await checkUserAuth(fromUser)

      if (!userAuth.authorized) {
        // 用户未授权，返回授权链接
        const authUrl = `https://v0-wechat-chatbot.vercel.app/auth/notion?userId=${fromUser}`
        const replyContent = `📝 欢迎使用微信日记AI！

请先授权连接您的Notion：
${authUrl}

授权完成后，您就可以直接发送文字，我会自动帮您生成日记并保存到Notion！`

        return new Response(createReplyXML(fromUser, toUser, replyContent), {
          headers: { "Content-Type": "application/xml" },
        })
      }

      // 用户已授权，处理消息
      try {
        await processUserMessage(fromUser, content, userAuth)

        const replyContent = `✅ 日记已生成并保存到您的Notion！

📖 内容：${content.substring(0, 50)}${content.length > 50 ? "..." : ""}

您可以在Notion中查看完整的结构化日记。`

        return new Response(createReplyXML(fromUser, toUser, replyContent), {
          headers: { "Content-Type": "application/xml" },
        })
      } catch (error) {
        console.error("Error processing message:", error)

        const replyContent = `❌ 处理失败，请稍后重试。

如果问题持续，请重新授权Notion连接。`

        return new Response(createReplyXML(fromUser, toUser, replyContent), {
          headers: { "Content-Type": "application/xml" },
        })
      }
    } else if (msgType === "event") {
      // 处理事件消息（如关注、取消关注）
      const eventMatch = body.match(/<Event><!\[CDATA\[(.+?)\]\]><\/Event>/)
      const event = eventMatch ? eventMatch[1] : ""

      if (event === "subscribe") {
        const welcomeContent = `🎉 欢迎关注微信日记AI！

我可以帮您将日常想法自动转化为结构化日记，并保存到Notion。

请先授权连接您的Notion：
https://v0-wechat-chatbot.vercel.app/auth/notion?userId=${fromUser}

授权后，直接发送文字给我，我会自动生成包含标题、摘要、情绪、关键词的日记！`

        return new Response(createReplyXML(fromUser, toUser, welcomeContent), {
          headers: { "Content-Type": "application/xml" },
        })
      }
    }

    return new Response("success")
  } catch (error) {
    console.error("Error processing WeChat message:", error)
    return new Response("Error", { status: 500 })
  }
}

// 检查用户授权状态
async function checkUserAuth(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/user/auth-status?userId=${userId}`)
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error("Error checking user auth:", error)
  }

  return { authorized: false }
}

// 处理用户消息
async function processUserMessage(userId: string, content: string, userAuth: any) {
  // 调用AI分析接口
  const aiResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/analyze-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      content,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!aiResponse.ok) {
    throw new Error("AI analysis failed")
  }

  const analysis = await aiResponse.json()

  // 保存到用户的Notion
  const notionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notion/save-diary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      analysis,
      userAuth,
    }),
  })

  if (!notionResponse.ok) {
    throw new Error("Notion save failed")
  }
}
