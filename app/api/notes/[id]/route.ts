// 模拟笔记数据库 - 应该与 notes/route.ts 共享
const notes: any[] = []

// 获取单个笔记
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const noteId = params.id

    console.log(`Fetching note with ID: ${noteId}`)

    // 从模拟数据库中查找笔记
    const note = notes.find((note) => note.id === noteId)

    if (!note) {
      console.log(`Note not found: ${noteId}`)
      return Response.json({ error: "笔记不存在" }, { status: 404 })
    }

    console.log(`Note found: ${note.title}`)

    return Response.json(note)
  } catch (error) {
    console.error("Error fetching note:", error)
    return Response.json({ error: "获取笔记失败" }, { status: 500 })
  }
}

// 更新笔记
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const noteId = params.id
    const { content } = await req.json()

    // 查找笔记
    const noteIndex = notes.findIndex((note) => note.id === noteId)

    if (noteIndex === -1) {
      return Response.json({ error: "笔记不存在" }, { status: 404 })
    }

    // 更新笔记内容
    notes[noteIndex] = {
      ...notes[noteIndex],
      originalContent: content,
      updatedAt: new Date().toISOString(),
    }

    console.log(`Note updated: ${noteId}`)

    return Response.json({
      success: true,
      note: notes[noteIndex],
    })
  } catch (error) {
    console.error("Error updating note:", error)
    return Response.json({ error: "更新笔记失败" }, { status: 500 })
  }
}

// 删除笔记
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const noteId = params.id

    // 查找笔记索引
    const noteIndex = notes.findIndex((note) => note.id === noteId)

    if (noteIndex === -1) {
      return Response.json({ error: "笔记不存在" }, { status: 404 })
    }

    // 删除笔记
    notes.splice(noteIndex, 1)
    console.log(`Note deleted: ${noteId}`)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting note:", error)
    return Response.json({ error: "删除笔记失败" }, { status: 500 })
  }
}
