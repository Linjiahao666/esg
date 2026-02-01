/**
 * 获取用户列表 API
 * 
 * 权限要求：管理员(admin)
 */

import { db, users } from '../../database'
import { requireAdmin, sanitizeUser } from '../../utils/auth'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  await requireAdmin(event)

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20

  // 获取用户列表
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)]
  })

  // 分页
  const total = allUsers.length
  const offset = (page - 1) * limit
  const paginatedUsers = allUsers.slice(offset, offset + limit)

  // 移除密码字段
  const safeUsers = paginatedUsers.map(sanitizeUser)

  return {
    success: true,
    data: safeUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})
