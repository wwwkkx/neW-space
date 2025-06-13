// 模拟文档数据库 - 应该与 documents/route.ts 共享
const documents: any[] = []

// 获取单个文档
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id

    console.log(`Fetching document with ID: ${documentId}`)
    console.log(`Total documents in database: ${documents.length}`)

    // 从模拟数据库中查找文档
    const document = documents.find((doc) => doc.id === documentId)

    if (!document) {
      console.log(`Document not found: ${documentId}`)
      return Response.json({ error: "文档不存在" }, { status: 404 })
    }

    console.log(`Document found: ${document.title}`)

    return Response.json(document)
  } catch (error) {
    console.error("Error fetching document:", error)
    return Response.json({ error: "获取文档失败" }, { status: 500 })
  }
}

// 更新文档
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id
    const { content } = await req.json()

    // 查找文档
    const documentIndex = documents.findIndex((doc) => doc.id === documentId)

    if (documentIndex === -1) {
      return Response.json({ error: "文档不存在" }, { status: 404 })
    }

    // 更新文档内容
    documents[documentIndex] = {
      ...documents[documentIndex],
      originalContent: content,
      updatedAt: new Date().toISOString(),
    }

    console.log(`Document updated: ${documentId}`)

    return Response.json({
      success: true,
      document: {
        ...documents[documentIndex],
        originalContent: undefined, // 不返回原始内容以节省带宽
      },
    })
  } catch (error) {
    console.error("Error updating document:", error)
    return Response.json({ error: "更新文档失败" }, { status: 500 })
  }
}

// 删除文档
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id

    // 查找文档索引
    const documentIndex = documents.findIndex((doc) => doc.id === documentId)

    if (documentIndex === -1) {
      return Response.json({ error: "文档不存在" }, { status: 404 })
    }

    // 删除文档
    const deletedDocument = documents.splice(documentIndex, 1)[0]
    console.log(`Document deleted: ${documentId}`)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return Response.json({ error: "删除文档失败" }, { status: 500 })
  }
}
