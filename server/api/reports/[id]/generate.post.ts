/**
 * 触发报告生成
 * POST /api/reports/:id/generate
 * 
 * 权限：审计者、管理员
 */
import { db, esgReports, reportGenerationTasks } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuditor } from '../../../utils/auth'
import { ReportEngine } from '../../../utils/report-engine'

export default defineEventHandler(async (event) => {
  // 验证权限
  const user = await requireAuditor(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)
  const { useAI = true, regenerate = false } = body

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

  // 检查报告状态
  if (report.status === 'generating') {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '报告正在生成中，请勿重复操作'
    }))
  }

  if (report.status === 'published') {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '已发布的报告不能重新生成'
    }))
  }

  // 创建生成任务
  const taskResult = await db.insert(reportGenerationTasks).values({
    reportId: id,
    taskType: 'full',
    parameters: JSON.stringify({ useAI, regenerate }),
    status: 'pending',
    progress: 0,
    createdBy: user.id,
    createdAt: new Date()
  }).returning()

  const task = taskResult[0]

  // 异步执行报告生成
  const engine = new ReportEngine({
    reportId: id,
    period: report.period,
    templateId: report.templateId || undefined,
    companyName: report.companyName || undefined,
    useAI,
    cacheAIContent: !regenerate
  })

  // 设置进度回调
  engine.setProgressCallback(async (progress, step) => {
    await db.update(reportGenerationTasks)
      .set({
        progress,
        currentStep: step,
        status: progress < 100 ? 'running' : 'completed'
      })
      .where(eq(reportGenerationTasks.id, task.id))
  })

  // 启动异步生成（不等待完成）
  engine.generateReport()
    .then(async () => {
      await db.update(reportGenerationTasks)
        .set({
          status: 'completed',
          progress: 100,
          completedAt: new Date()
        })
        .where(eq(reportGenerationTasks.id, task.id))
    })
    .catch(async (error) => {
      await db.update(reportGenerationTasks)
        .set({
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        })
        .where(eq(reportGenerationTasks.id, task.id))
    })

  return {
    success: true,
    data: {
      taskId: task.id,
      message: '报告生成任务已启动'
    }
  }
})