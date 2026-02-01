/**
 * 更新用户角色 API
 * 
 * 权限要求：管理员(admin)
 */

import { db, users } from '../../database'
import { requireAdmin, ROLES, type UserRole } from '../../utils/auth'
import { eq } from 'drizzle-orm'

interface UpdateUserRequest {
  userId: number
  role?: UserRole
  name?: string
}

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  const admin = await requireAdmin(event)

  const body = await readBody<UpdateUserRequest>(event)

  if (!body.userId) {
    throw createError({
      statusCode: 400,
      message: '请提供用户ID'
    })
  }

  // 不能修改自己的角色
  if (body.userId === admin.id && body.role) {
    throw createError({
      statusCode: 400,
      message: '不能修改自己的角色'
    })
  }

  // 验证角色有效性
  const validRoles = Object.values(ROLES)
  if (body.role && !validRoles.includes(body.role)) {
    throw createError({
      statusCode: 400,
      message: `无效的角色，允许的角色: ${validRoles.join(', ')}`
    })
  }

  // 检查用户是否存在
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, body.userId)
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: '用户不存在'
    })
  }

  // 构建更新数据
  const updateData: Record<string, any> = {
    updatedAt: new Date()
  }

  if (body.role) {
    updateData.role = body.role
  }
  if (body.name) {
    updateData.name = body.name.trim()
  }

  // 更新用户
  await db.update(users)
    .set(updateData)
    .where(eq(users.id, body.userId))

  // 获取更新后的用户
  const updatedUser = await db.query.users.findFirst({
    where: eq(users.id, body.userId)
  })

  // 移除密码字段
  const { password, ...safeUser } = updatedUser!

  return {
    success: true,
    message: '用户信息已更新',
    data: safeUser
  }
})
