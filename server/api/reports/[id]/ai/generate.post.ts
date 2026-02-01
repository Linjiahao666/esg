/**
 * AI 生成章节内容
 * POST /api/reports/:id/ai/generate
 * 
 * 权限：审计者、管理员
 */
import { db, esgReports, reportSections } from '../../../../database'
import { eq, and } from 'drizzle-orm'
import { requireAuditor } from '../../../../utils/auth'
import { ReportEngine } from '../../../../utils/report-engine'
import { isLLMConfigured } from '../../../../utils/llm-client'

export default defineEventHandler(async (event) => {
  // 验证权限
  await requireAuditor(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)
  const { sectionCode, regenerate = false } = body

  if (!id || isNaN(id)) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '无效的报告 ID'
    }))
  }

  if (!sectionCode) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '缺少章节代码参数'
    }))
  }

  // 检查 LLM 配置
  if (!isLLMConfigured()) {
    return sendError(event, createError({
      statusCode: 503,
      statusMessage: '未配置 AI 服务，请在环境变量中设置 LLM API Key'
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

  try {
    const engine = new ReportEngine({
      reportId: id,
      period: report.period,
      companyName: report.companyName || undefined,
      useAI: true,
      cacheAIContent: !regenerate
    })

    const result = await engine.generateSectionAI(sectionCode, regenerate)

    return {
      success: true,
      data: {
        sectionCode,
        content: result.content,
        tokensUsed: result.tokensUsed,
        fromCache: result.fromCache
      }
    }

  } catch (error: any) {
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: `AI 生成失败: ${error.message}`
    }))
  }
})