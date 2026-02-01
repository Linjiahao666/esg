/**
 * 解决/处理检查结果
 * POST /api/esg/compliance/results/[id]/resolve
 */
import { db, complianceResults, complianceAuditLogs } from '../../../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../../../utils/auth'

interface ResolveBody {
  resolveStatus: 'resolved' | 'ignored' | 'deferred'
  remark?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody<ResolveBody>(event)

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: '无效的结果ID',
    })
  }

  if (!body.resolveStatus || !['resolved', 'ignored', 'deferred'].includes(body.resolveStatus)) {
    throw createError({
      statusCode: 400,
      message: '无效的解决状态',
    })
  }

  // 查找现有结果
  const existing = await db.query.complianceResults.findFirst({
    where: eq(complianceResults.id, id),
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '检查结果不存在',
    })
  }

  // 更新解决状态
  const result = await db
    .update(complianceResults)
    .set({
      resolveStatus: body.resolveStatus,
      resolveRemark: body.remark || null,
      resolvedBy: user.id,
      resolvedAt: new Date(),
    })
    .where(eq(complianceResults.id, id))
    .returning()

  const updatedResult = result[0]

  // 记录审计日志
  await db.insert(complianceAuditLogs).values({
    action: 'resolve',
    targetType: 'result',
    targetId: id,
    beforeSnapshot: JSON.stringify({ resolveStatus: existing.resolveStatus }),
    afterSnapshot: JSON.stringify({ resolveStatus: body.resolveStatus, remark: body.remark }),
    changeDescription: `处理检查结果: ${body.resolveStatus}${body.remark ? ` - ${body.remark}` : ''}`,
    operatorId: user.id,
  })

  const statusLabels: Record<string, string> = {
    resolved: '已解决',
    ignored: '已忽略',
    deferred: '已延后',
  }

  return {
    success: true,
    data: updatedResult,
    message: `检查结果已标记为: ${statusLabels[body.resolveStatus]}`,
  }
})
