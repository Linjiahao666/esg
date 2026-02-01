/**
 * 获取报告详情
 * GET /api/reports/:id
 * 
 * 权限：所有已登录用户
 */
import { db, esgReports, reportSections, reportTemplates, users } from '../../database'
import { eq, asc } from 'drizzle-orm'
import { requireViewer } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证权限
  await requireViewer(event)

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

  // 获取章节
  const sections = await db.query.reportSections.findMany({
    where: eq(reportSections.reportId, id),
    orderBy: [asc(reportSections.sortOrder)]
  })

  // 获取模板信息
  let template = null
  if (report.templateId) {
    template = await db.query.reportTemplates.findFirst({
      where: eq(reportTemplates.id, report.templateId)
    })
  }

  // 获取相关用户信息
  const userIds = [
    report.createdBy,
    report.submittedBy,
    report.reviewedBy,
    report.publishedBy
  ].filter(Boolean) as number[]

  const userList = userIds.length > 0
    ? await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, userIds),
      columns: { id: true, name: true, email: true, avatar: true }
    })
    : []

  const usersMap = new Map(userList.map(u => [u.id, u]))

  return {
    success: true,
    data: {
      ...report,
      config: report.config ? JSON.parse(report.config) : null,
      complianceSummary: report.complianceSummary ? JSON.parse(report.complianceSummary) : null,
      dataIntegritySummary: report.dataIntegritySummary ? JSON.parse(report.dataIntegritySummary) : null,
      exportFiles: report.exportFiles ? JSON.parse(report.exportFiles) : null,
      template,
      sections: sections.map(s => ({
        ...s,
        metricsData: s.metricsData ? JSON.parse(s.metricsData) : [],
        chartsConfig: s.chartsConfig ? JSON.parse(s.chartsConfig) : []
      })),
      createdByUser: report.createdBy ? usersMap.get(report.createdBy) : null,
      submittedByUser: report.submittedBy ? usersMap.get(report.submittedBy) : null,
      reviewedByUser: report.reviewedBy ? usersMap.get(report.reviewedBy) : null,
      publishedByUser: report.publishedBy ? usersMap.get(report.publishedBy) : null
    }
  }
})