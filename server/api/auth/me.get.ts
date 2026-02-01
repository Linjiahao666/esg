import { getCurrentUser, sanitizeUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    })
  }

  return {
    success: true,
    user: sanitizeUser(user)
  }
})
