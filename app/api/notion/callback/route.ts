export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const error = url.searchParams.get("error")

    console.log("Notion callback received:", { code: !!code, state, error })

    // 如果有错误，返回错误页面
    if (error) {
      console.error("Notion OAuth error:", error)
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>授权失败</title>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'NOTION_AUTH_ERROR',
              error: '${error}'
            }, '${url.origin}');
            window.close();
          </script>
        </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    // 如果没有授权码，返回错误
    if (!code) {
      console.error("No authorization code received")
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>授权失败</title>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'NOTION_AUTH_ERROR',
              error: '未获取到授权码'
            }, '${url.origin}');
            window.close();
          </script>
        </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    // 获取Notion访问令牌
    const clientId = process.env.NOTION_CLIENT_ID
    const clientSecret = process.env.NOTION_CLIENT_SECRET
    // 确保与授权时使用的完全一致
    const redirectUri = "https://v0-wechat-chatbot.vercel.app/api/notion/callback"

    console.log("Token exchange params:", { clientId: !!clientId, clientSecret: !!clientSecret, redirectUri })

    if (!clientId || !clientSecret) {
      console.error("Missing Notion credentials")
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>配置错误</title>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'NOTION_AUTH_ERROR',
              error: 'Notion应用配置不完整'
            }, '${url.origin}');
            window.close();
          </script>
        </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    const tokenRequestBody = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }

    console.log("Token request body:", tokenRequestBody)

    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: JSON.stringify(tokenRequestBody),
    })

    console.log("Token response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Token exchange failed:", errorData)
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>授权失败</title>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'NOTION_AUTH_ERROR',
              error: '获取访问令牌失败: ${errorData.error || errorData.message || "未知错误"}'
            }, '${url.origin}');
            window.close();
          </script>
        </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, workspace_name, workspace_id, bot_id } = tokenData

    console.log("Token exchange successful:", { workspace_name, workspace_id, bot_id })

    // 创建Notion数据库
    const databaseResponse = await fetch("https://api.notion.com/v1/databases", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
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
              content: "wspace",
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

    let databaseId = null
    let databaseName = "智能笔记助手"

    if (databaseResponse.ok) {
      const databaseData = await databaseResponse.json()
      databaseId = databaseData.id
      databaseName = databaseData.title?.[0]?.text?.content || "智能笔记助手"
      console.log("Database created successfully:", databaseId)
    } else {
      const dbError = await databaseResponse.json()
      console.error("Database creation failed:", dbError)
    }

    const authData = {
      notionToken: access_token,
      databaseId,
      workspaceName: workspace_name,
      workspaceId: workspace_id,
      botId: bot_id,
      databaseName,
      authorizedAt: new Date().toISOString(),
    }

    // 返回成功页面，通过postMessage通知父窗口
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>授权成功</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            backdrop-filter: blur(10px);
          }
          .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
          }
          p {
            margin: 0;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>授权成功！</h1>
          <p>正在返回应用...</p>
        </div>
        <script>
          console.log('Sending success message to parent window');
          // 通知父窗口授权成功
          window.opener?.postMessage({
            type: 'NOTION_AUTH_SUCCESS',
            data: ${JSON.stringify(authData)}
          }, '${url.origin}');
          
          // 延迟关闭窗口，让用户看到成功消息
          setTimeout(() => {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  } catch (error) {
    console.error("Error in Notion callback:", error)

    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>授权失败</title>
        <meta charset="utf-8">
      </head>
      <body>
        <script>
          window.opener?.postMessage({
            type: 'NOTION_AUTH_ERROR',
            error: '服务器错误，请重试'
          }, '${new URL(req.url).origin}');
          window.close();
        </script>
      </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  }
}
