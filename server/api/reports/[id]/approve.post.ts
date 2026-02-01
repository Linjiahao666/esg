/**
 * 审核通过报告
 * POST /api/reports/:id/approve
 * 
 * 权限：管理员
 * 
 * 流程：review -> approved
 */
import { db, esgReports, reportVersions } from '../../../database'
import { eq, desc } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证权限（仅管理员可审核）
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
      statusMessage: `当前状态 "${report.status}" 不允许审核`
    }))
  }

  // 创建版本快照
  const lastVersion = await db.query.reportVersions.findFirst({
    where: eq(reportVersions.reportId, id),
    orderBy: [desc(reportVersions.versionNumber)]
  })

  const newVersionNumber = (lastVersion?.versionNumber || 0) + 1

  await db.insert(reportVersions).values({
    reportId: id,
    versionNumber: newVersionNumber,
    versionTag: `approved-v${newVersionNumber}`,
    changeDescription: comment || '审核通过',
    contentSnapshot: JSON.stringify({
      title: report.title,
      period: report.period,
      htmlContent: report.htmlContent,
      complianceSummary: report.complianceSummary
    }),
    createdBy: user.id,
    createdAt: new Date()
  })

  // 更新状态
  await db.update(esgReports)
    .set({
      status: 'approved',
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewComment: comment,
      updatedAt: new Date()
    })
    .where(eq(esgReports.id, id))

  return {
    success: true,
    data: {
      message: '报告审核通过',
      version: newVersionNumber
    }
  }
})