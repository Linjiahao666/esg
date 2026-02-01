/**
 * 管理员创建用户 API
 * 
 * 权限要求：管理员(admin)
 */

import { db, users } from '../../database'
import { requireAdmin, hashPassword, ROLES, type UserRole } from '../../utils/auth'
import { eq } from 'drizzle-orm'

interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: UserRole
}

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  await requireAdmin(event)

  const body = await readBody<CreateUserRequest>(event)

  // 验证必填字段
  if (!body.email || !body.password || !body.name || !body.role) {
    throw createError({
      statusCode: 400,
      message: '请填写所有必填字段：email, password, name, role'
    })
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      message: '请输入有效的邮箱地址'
    })
  }

  // 验证密码强度
  if (body.password.length < 6) {
    throw createError({
      statusCode: 400,
      message: '密码长度至少为6位'
    })
  }

  // 验证角色有效性
  const validRoles = Object.values(ROLES)
  if (!validRoles.includes(body.role)) {
    throw createError({
      statusCode: 400,
      message: `无效的角色，允许的角色: ${validRoles.join(', ')}`
    })
  }

  // 检查邮箱是否已存在
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, body.email.toLowerCase())
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: '该邮箱已被注册'
    })
  }

  // 创建用户
  const hashedPassword = await hashPassword(body.password)

  const result = await db
    .insert(users)
    .values({
      email: body.email.toLowerCase(),
      password: hashedPassword,
      name: body.name.trim(),
      role: body.role
    })
    .returning()

  const newUser = result[0]

  if (!newUser) {
    throw createError({
      statusCode: 500,
      message: '创建用户失败'
    })
  }

  // 移除密码字段
  const { password, ...safeUser } = newUser

  return {
    success: true,
    message: '用户创建成功',
    data: safeUser
  }
})
