/**
 * 发布报告
 * POST /api/reports/:id/publish
 * 
 * 权限：管理员
 * 
 * 流程：approved -> published
 */
import { db, esgReports, reportVersions } from '../../../database'
import { eq, desc } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证权限（仅管理员可发布）
  const user = await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id') || '')

  if (!id || isNaN(id)) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '无效的报告 ID'
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
  if (report.status !== 'approved') {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: `当前状态 "${report.status}" 不允许发布，报告必须先通过审核`
    }))
  }

  // 创建发布版本快照
  const lastVersion = await db.query.reportVersions.findFirst({
    where: eq(reportVersions.reportId, id),
    orderBy: [desc(reportVersions.versionNumber)]
  })

  const newVersionNumber = (lastVersion?.versionNumber || 0) + 1

  await db.insert(reportVersions).values({
    reportId: id,
    versionNumber: newVersionNumber,
    versionTag: `published-v${newVersionNumber}`,
    changeDescription: '正式发布',
    contentSnapshot: JSON.stringify({
      title: report.title,
      period: report.period,
      htmlContent: report.htmlContent,
      complianceSummary: report.complianceSummary,
      publishedAt: new Date().toISOString()
    }),
    createdBy: user.id,
    createdAt: new Date()
  })

  // 更新状态
  await db.update(esgReports)
    .set({
      status: 'published',
      publishedBy: user.id,
      publishedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(esgReports.id, id))

  return {
    success: true,
    data: {
      message: '报告已正式发布',
      version: newVersionNumber,
      publishedAt: new Date().toISOString()
    }
  }
})