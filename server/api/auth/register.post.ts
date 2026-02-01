import { db, users } from '../../database'
import { hashPassword, generateToken, setAuthCookie, sanitizeUser, ROLES } from '../../utils/auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 验证必填字段
  const { email, password, name } = body

  if (!email || !password || !name) {
    throw createError({
      statusCode: 400,
      message: '请填写所有必填字段'
    })
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      message: '请输入有效的邮箱地址'
    })
  }

  // 验证密码强度
  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      message: '密码长度至少为6位'
    })
  }

  // 检查邮箱是否已存在
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase())
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: '该邮箱已被注册'
    })
  }

  // 创建用户
  // 公开注册默认为"查看者"角色，其他角色需要管理员分配
  const hashedPassword = await hashPassword(password)

  const result = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role: ROLES.VIEWER // 默认为查看者角色
    })
    .returning()

  const newUser = result[0]
  if (!newUser) {
    throw createError({
      statusCode: 500,
      message: '创建用户失败'
    })
  }

  // 生成 token
  const token = generateToken(newUser)

  // 设置 cookie
  setAuthCookie(event, token)

  return {
    success: true,
    message: '注册成功',
    user: sanitizeUser(newUser),
    token
  }
})
