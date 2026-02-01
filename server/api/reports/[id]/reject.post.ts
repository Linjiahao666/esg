/**
 * 退回报告
 * POST /api/reports/:id/reject
 * 
 * 权限：管理员
 * 
 * 流程：review -> draft
 */
import { db, esgReports } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证权限（仅管理员可退回）
  const user = await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)
  const { comment } = body

  if (!id || isNaN(id)) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '无效的报告 ID'
    }))
  }

  if (!comment) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '退回时必须填写退回原因'
    }))
  }

  // 获取报告
  const report = await db.query.esgReports.findFirst({
    where: eq(esgReports.id, id)
  })

  if (!report) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: '报告不存在'
    }))
  }

  // 检查状态
  if (report.status !== 'review') {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: `当前状态 "${report.status}" 不允许退回`
    }))
  }

  // 更新状态
  await db.update(esgReports)
    .set({
      status: 'draft',
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewComment: comment,
      updatedAt: new Date()
    })
    .where(eq(esgReports.id, id))

  return {
    success: true,
    data: {
      message: '报告已退回',
      comment
    }
  }
})