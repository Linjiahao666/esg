/**
 * 提交报告审核
 * POST /api/reports/:id/submit
 * 
 * 权限：审计者、管理员
 * 
 * 流程：draft -> review
 */
import { db, esgReports, reportSections } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuditor } from '../../../utils/auth'
import { ComplianceEngine } from '../../../utils/compliance-engine'

export default defineEventHandler(async (event) => {
  // 验证权限
  const user = await requireAuditor(event)

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
  if (report.status !== 'draft' && report.status !== 'review') {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: `当前状态 "${report.status}" 不允许提交审核`
    }))
  }

  // 检查报告是否已生成
  if (!report.htmlContent) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '请先生成报告内容再提交审核'
    }))
  }

  // 检查章节完整性
  const sections = await db.query.reportSections.findMany({
    where: eq(reportSections.reportId, id)
  })

  const emptySections = sections.filter(s => !s.content || s.content.trim() === '')
  if (emptySections.length > 0) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: `以下章节内容为空：${emptySections.map(s => s.title).join('、')}`
    }))
  }

  // 执行最终合规检查
  const complianceEngine = new ComplianceEngine(report.period)
  const complianceResult = await complianceEngine.batchCheck({ triggerType: 'manual' })

  // 如果有阻断性错误，不允许提交
  const blockingErrors = complianceResult.errors.filter(e => e.severity === 'error')
  if (blockingErrors.length > 0) {
    return {
      success: false,
      data: {
        message: '存在合规性问题，请先解决后再提交',
        errors: blockingErrors.slice(0, 10)
      }
    }
  }

  // 更新状态
  await db.update(esgReports)
    .set({
      status: 'review',
      submittedBy: user.id,
      submittedAt: new Date(),
      complianceSummary: JSON.stringify({
        total: complianceResult.total,
        passed: complianceResult.passed,
        failed: complianceResult.failed,
        warnings: complianceResult.warnings,
        checkTime: new Date().toISOString()
      }),
      updatedAt: new Date()
    })
    .where(eq(esgReports.id, id))

  return {
    success: true,
    data: {
      message: '报告已提交审核',
      complianceSummary: {
        total: complianceResult.total,
        passed: complianceResult.passed,
        warnings: complianceResult.warnings
      }
    }
  }
})