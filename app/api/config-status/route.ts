export async function GET() {
  try {
    const status = {
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      notion: !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID),
    }

    return Response.json(status)
  } catch (error) {
    console.error("Error checking configuration:", error)
    return Response.json({ error: "Failed to check configuration" }, { status: 500 })
  }
}
