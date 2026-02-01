/**
 * 更新合规规则
 * PUT /api/esg/compliance/rules/[id]
 */
import { db, complianceRules, complianceAuditLogs } from '../../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/auth'

interface UpdateRuleBody {
  name?: string
  description?: string
  ruleType?: string
  targetMetrics?: string[]
  targetSubModules?: string[]
  condition?: Record<string, any>
  severity?: string
  regulation?: string
  message?: string
  suggestion?: string
  triggerOn?: string
  priority?: number
  enabled?: boolean
  applicablePeriods?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody<UpdateRuleBody>(event)

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: '无效的规则ID',
    })
  }

  // 查找现有规则
  const existing = await db.query.complianceRules.findFirst({
    where: eq(complianceRules.id, id),
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '规则不存在',
    })
  }

  // 构建更新数据
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  }

  if (body.name !== undefined) updateData.name = body.name
  if (body.description !== undefined) updateData.description = body.description
  if (body.ruleType !== undefined) updateData.ruleType = body.ruleType
  if (body.targetMetrics !== undefined) updateData.targetMetrics = JSON.stringify(body.targetMetrics)
  if (body.targetSubModules !== undefined) updateData.targetSubModules = JSON.stringify(body.targetSubModules)
  if (body.condition !== undefined) updateData.condition = JSON.stringify(body.condition)
  if (body.severity !== undefined) updateData.severity = body.severity
  if (body.regulation !== undefined) updateData.regulation = body.regulation
  if (body.message !== undefined) updateData.message = body.message
  if (body.suggestion !== undefined) updateData.suggestion = body.suggestion
  if (body.triggerOn !== undefined) updateData.triggerOn = body.triggerOn
  if (body.priority !== undefined) updateData.priority = body.priority
  if (body.enabled !== undefined) updateData.enabled = body.enabled
  if (body.applicablePeriods !== undefined) updateData.applicablePeriods = body.applicablePeriods

  // 更新数据库
  const result = await db
    .update(complianceRules)
    .set(updateData)
    .where(eq(complianceRules.id, id))
    .returning()

  const updatedRule = result[0]

  if (!updatedRule) {
    throw createError({
      statusCode: 500,
      message: '更新规则失败',
    })
  }

  // 记录审计日志
  await db.insert(complianceAuditLogs).values({
    action: 'rule_update',
    targetType: 'rule',
    targetId: id,
    beforeSnapshot: JSON.stringify(existing),
    afterSnapshot: JSON.stringify(updatedRule),
    changeDescription: `更新合规规则: ${updatedRule.name}`,
    operatorId: user.id,
  })

  return {
    success: true,
    data: {
      ...updatedRule,
      targetMetrics: updatedRule.targetMetrics ? JSON.parse(updatedRule.targetMetrics) : null,
      targetSubModules: updatedRule.targetSubModules ? JSON.parse(updatedRule.targetSubModules) : null,
      condition: updatedRule.condition ? JSON.parse(updatedRule.condition) : null,
    },
    message: '规则更新成功',
  }
})
