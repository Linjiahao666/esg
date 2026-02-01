import { db, files } from '../../database'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const query = getQuery(event)
  const category = query.category as string | undefined

  // 构建查询条件
  let queryBuilder = db.query.files.findMany({
    where: eq(files.userId, user.id),
    orderBy: [desc(files.createdAt)]
  })

  // 查询用户的所有文件
  const userFiles = await db.query.files.findMany({
    where: eq(files.userId, user.id),
    orderBy: [desc(files.createdAt)]
  })

  // 按分类过滤
  const filteredFiles = category
    ? userFiles.filter((f) => f.category === category)
    : userFiles

  return {
    success: true,
    files: filteredFiles.map((file) => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      url: `/api/files/${file.id}`,
      createdAt: file.createdAt
    }))
  }
})
