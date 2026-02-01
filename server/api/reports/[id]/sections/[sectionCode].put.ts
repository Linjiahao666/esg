/**
 * 更新章节内容
 * PUT /api/reports/:id/sections/:sectionCode
 * 
 * 权限：审计者、管理员
 */
import { db, esgReports, reportSections } from '../../../../database'
import { eq, and } from 'drizzle-orm'
import { requireAuditor } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证权限
  await requireAuditor(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  const sectionCode = getRouterParam(event, 'sectionCode')
  const body = await readBody(event)
  const { content, title } = body

  if (!id || isNaN(id)) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '无效的报告 ID'
    }))
  }

  if (!sectionCode) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '无效的章节代码'
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

  // 检查报告状态
  if (report.status === 'published') {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '已发布的报告不能编辑'
    }))
  }

  // 获取章节
  const section = await db.query.reportSections.findFirst({
    where: and(
      eq(reportSections.reportId, id),
      eq(reportSections.sectionCode, sectionCode)
    )
  })

  if (!section) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: '章节不存在'
    }))
  }

  // 更新章节
  const updateData: Record<string, any> = {
    updatedAt: new Date()
  }

  if (content !== undefined) {
    updateData.content = content
    updateData.isManuallyEdited = true
  }

  if (title !== undefined) {
    updateData.title = title
  }

  await db.update(reportSections)
    .set(updateData)
    .where(eq(reportSections.id, section.id))

  // 获取更新后的章节
  const updatedSection = await db.query.reportSections.findFirst({
    where: eq(reportSections.id, section.id)
  })

  return {
    success: true,
    data: updatedSection
  }
})