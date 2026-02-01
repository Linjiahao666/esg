import { db, users } from '../../database'
import {
  verifyPassword,
  generateToken,
  setAuthCookie,
  sanitizeUser
} from '../../utils/auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { email, password, remember } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: '请输入邮箱和密码'
    })
  }

  // 查找用户
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase())
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '邮箱或密码错误'
    })
  }

  // 验证密码
  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: '邮箱或密码错误'
    })
  }

  // 更新最后登录时间
  await db
    .update(users)
    .set({ updatedAt: new Date() })
    .where(eq(users.id, user.id))

  // 生成 token
  const token = generateToken(user)

  // 设置 cookie（如果选择记住我，则延长有效期）
  if (remember) {
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 天
      path: '/'
    })
  } else {
    setAuthCookie(event, token)
  }

  return {
    success: true,
    message: '登录成功',
    user: sanitizeUser(user),
    token
  }
})
