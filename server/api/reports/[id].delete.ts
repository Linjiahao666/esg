/**
 * 删除报告
 * DELETE /api/reports/:id
 */

import { eq, and } from 'drizzle-orm'
import { db, esgReports, reportSections, reportVersions } from '../../database'

export default defineEventHandler(async (event) => {
  // 验证用户身份
  const user = await requireAuth(event)

  const reportId = parseInt(getRouterParam(event, 'id') || '')

  if (!reportId) {
    throw createError({
      statusCode: 400,
      message: '无效的报告 ID'
    })
  }

  // 获取报告
  const report = await db.query.esgReports.findFirst({
    where: eq(esgReports.id, reportId)
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: '报告不存在'
    })
  }

  // 检查权限：只有创建者或管理员可以删除
  if (report.createdById !== user.id && user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '没有权限删除此报告'
    })
  }

  // 只有草稿状态的报告可以删除
  if (report.status !== 'draft') {
    throw createError({
      statusCode: 400,
      message: '只能删除草稿状态的报告'
    })
  }

  // 删除相关数据
  await db.delete(reportSections).where(eq(reportSections.reportId, reportId))
  await db.delete(reportVersions).where(eq(reportVersions.reportId, reportId))
  await db.delete(esgReports).where(eq(esgReports.id, reportId))

  return {
    success: true,
    message: '报告已删除'
  }
})