import { createReadStream, existsSync } from 'fs'
import { db, files } from '../../database'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '请提供文件 ID'
    })
  }

  // 查找文件记录
  const file = await db.query.files.findFirst({
    where: eq(files.id, parseInt(id))
  })

  if (!file) {
    throw createError({
      statusCode: 404,
      message: '文件不存在'
    })
  }

  // 检查文件是否存在
  if (!existsSync(file.path)) {
    throw createError({
      statusCode: 404,
      message: '文件已被删除'
    })
  }

  // 设置响应头
  setHeader(event, 'Content-Type', file.mimeType)
  setHeader(event, 'Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`)

  // 返回文件流
  return sendStream(event, createReadStream(file.path))
})
