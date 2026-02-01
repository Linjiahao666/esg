/**
 * 获取报告生成进度
 * GET /api/reports/:id/progress
 * 
 * 权限：所有已登录用户
 */
import { db, esgReports, reportGenerationTasks } from '../../../database'
import { eq, desc } from 'drizzle-orm'
import { requireViewer } from '../../../utils/auth'

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

  // 获取最新的生成任务
  const latestTask = await db.query.reportGenerationTasks.findFirst({
    where: eq(reportGenerationTasks.reportId, id),
    orderBy: [desc(reportGenerationTasks.createdAt)]
  })

  return {
    success: true,
    data: {
      reportId: id,
      reportStatus: report.status,
      reportProgress: report.progress,
      task: latestTask ? {
        taskId: latestTask.id,
        taskType: latestTask.taskType,
        status: latestTask.status,
        progress: latestTask.progress,
        currentStep: latestTask.currentStep,
        errorMessage: latestTask.errorMessage,
        startedAt: latestTask.startedAt,
        completedAt: latestTask.completedAt
      } : null
    }
  }
})