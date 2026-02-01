/**
 * 创建新报告
 * POST /api/reports
 * 
 * 权限：审计者、管理员
 */
import { db, esgReports, reportTemplates, reportSections } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAuditor } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证权限
  const user = await requireAuditor(event)

  const body = await readBody(event)
  const { title, period, periodType, templateId, companyName, companyLogo, config } = body

  // 验证必填字段
  if (!title || !period) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '报告标题和周期为必填项'
    }))
  }

  // 验证模板存在
  if (templateId) {
    const template = await db.query.reportTemplates.findFirst({
      where: eq(reportTemplates.id, templateId)
    })

    if (!template) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: '指定的报告模板不存在'
      }))
    }
  }

  // 创建报告
  const result = await db.insert(esgReports).values({
    title,
    period,
    periodType: periodType || 'yearly',
    templateId,
    companyName,
    companyLogo,
    config: config ? JSON.stringify(config) : null,
    status: 'draft',
    progress: 0,
    createdBy: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning()

  const report = result[0]

  // 如果有模板，初始化章节结构
  if (templateId) {
    const template = await db.query.reportTemplates.findFirst({
      where: eq(reportTemplates.id, templateId)
    })

    if (template?.config) {
      const templateConfig = JSON.parse(template.config)
      const sections = templateConfig.sections || []

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        await db.insert(reportSections).values({
          reportId: report.id,
          sectionCode: section.code,
          title: section.title,
          level: section.level || 1,
          sortOrder: i,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
  } else {
    // 使用默认章节结构
    const defaultSections = [
      { code: 'executive_summary', title: '执行摘要', level: 1 },
      { code: 'E', title: '环境责任', level: 1 },
      { code: 'E1', title: '碳排放与管理', level: 2 },
      { code: 'E2', title: '污染物排放及处理', level: 2 },
      { code: 'E3', title: '资源消耗与管理', level: 2 },
      { code: 'E4', title: '环境管理与环境保护', level: 2 },
      { code: 'S', title: '社会责任', level: 1 },
      { code: 'S1', title: '员工', level: 2 },
      { code: 'S2', title: '供应链管理与负责任生产', level: 2 },
      { code: 'S3', title: '社会责任', level: 2 },
      { code: 'G', title: '公司治理', level: 1 },
      { code: 'G1', title: '治理结构', level: 2 },
      { code: 'G2', title: '治理机制', level: 2 },
      { code: 'data_insights', title: '数据洞察与分析', level: 1 }
    ]

    for (let i = 0; i < defaultSections.length; i++) {
      const section = defaultSections[i]
      await db.insert(reportSections).values({
        reportId: report.id,
        sectionCode: section.code,
        title: section.title,
        level: section.level,
        sortOrder: i,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
  }

  return {
    success: true,
    data: report
  }
})