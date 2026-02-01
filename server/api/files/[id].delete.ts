import { existsSync, unlinkSync } from 'fs'
import { db, files } from '../../database'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '请提供文件 ID'
    })
  }

  // 查找文件记录
  const file = await db.query.files.findFirst({
    where: and(eq(files.id, parseInt(id)), eq(files.userId, user.id))
  })

  if (!file) {
    throw createError({
      statusCode: 404,
      message: '文件不存在或无权限删除'
    })
  }

  // 删除物理文件
  if (existsSync(file.path)) {
    unlinkSync(file.path)
  }

  // 删除数据库记录
  await db.delete(files).where(eq(files.id, file.id))

  return {
    success: true,
    message: '文件已删除'
  }
})
