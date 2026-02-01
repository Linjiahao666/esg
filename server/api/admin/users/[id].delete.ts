/**
 * 删除用户 API
 * 
 * 权限要求：管理员(admin)
 */

import { db, users } from '../../../database'
import { requireAdmin } from '../../../utils/auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  const admin = await requireAdmin(event)

  const userId = Number(getRouterParam(event, 'id'))

  if (!userId || isNaN(userId)) {
    throw createError({
      statusCode: 400,
      message: '请提供有效的用户ID'
    })
  }

  // 不能删除自己
  if (userId === admin.id) {
    throw createError({
      statusCode: 400,
      message: '不能删除自己的账户'
    })
  }

  // 检查用户是否存在
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: '用户不存在'
    })
  }

  // 删除用户
  await db.delete(users).where(eq(users.id, userId))

  return {
    success: true,
    message: '用户已删除'
  }
})
