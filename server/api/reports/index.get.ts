/**
 * 获取报告列表
 * GET /api/reports
 * 
 * 权限：所有已登录用户
 */
import { db, esgReports, reportTemplates, users } from '../../database'
import { eq, desc, and, like, inArray } from 'drizzle-orm'
import { requireViewer } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证权限
  await requireViewer(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 10
  const status = query.status as string
  const period = query.period as string
  const search = query.search as string

  // 构建查询条件
  const conditions = []

  if (status) {
    conditions.push(eq(esgReports.status, status))
  }

  if (period) {
    conditions.push(eq(esgReports.period, period))
  }

  if (search) {
    conditions.push(like(esgReports.title, `%${search}%`))
  }

  // 查询报告列表
  const reports = await db.query.esgReports.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(esgReports.updatedAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize
  })

  // 获取关联数据
  const templateIds = [...new Set(reports.map(r => r.templateId).filter(Boolean))] as number[]
  const userIds = [...new Set([
    ...reports.map(r => r.createdBy),
    ...reports.map(r => r.submittedBy),
    ...reports.map(r => r.reviewedBy)
  ].filter(Boolean))] as number[]

  const templates = templateIds.length > 0
    ? await db.query.reportTemplates.findMany({
      where: inArray(reportTemplates.id, templateIds)
    })
    : []

  const userList = userIds.length > 0
    ? await db.query.users.findMany({
      where: inArray(users.id, userIds),
      columns: { id: true, name: true, email: true }
    })
    : []

  const templatesMap = new Map(templates.map(t => [t.id, t]))
  const usersMap = new Map(userList.map(u => [u.id, u]))

  // 组装结果
  const items = reports.map(report => ({
    id: report.id,
    title: report.title,
    period: report.period,
    periodType: report.periodType,
    status: report.status,
    progress: report.progress,
    companyName: report.companyName,
    template: report.templateId ? templatesMap.get(report.templateId) : null,
    createdBy: report.createdBy ? usersMap.get(report.createdBy) : null,
    submittedBy: report.submittedBy ? usersMap.get(report.submittedBy) : null,
    reviewedBy: report.reviewedBy ? usersMap.get(report.reviewedBy) : null,
    submittedAt: report.submittedAt,
    reviewedAt: report.reviewedAt,
    publishedAt: report.publishedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  }))

  // 获取总数
  const totalResult = await db.select({ count: db.$count(esgReports) })
    .from(esgReports)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  const total = totalResult[0]?.count || 0

  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }
})