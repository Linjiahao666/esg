/**
 * 创建合规规则
 * POST /api/esg/compliance/rules
 */
import { db, complianceRules, complianceAuditLogs } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import type { NewComplianceRule } from '../../../database/schema'

interface CreateRuleBody {
  code: string
  name: string
  description?: string
  ruleType: string
  targetMetrics?: string[]
  targetSubModules?: string[]
  condition: Record<string, any>
  severity?: string
  regulation?: string
  message: string
  suggestion?: string
  triggerOn?: string
  priority?: number
  enabled?: boolean
  applicablePeriods?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<CreateRuleBody>(event)

  // 验证必填字段
  if (!body.code || !body.name || !body.ruleType || !body.condition || !body.message) {
    throw createError({
      statusCode: 400,
      message: '缺少必填字段: code, name, ruleType, condition, message',
    })
  }

  // 检查编码是否已存在
  const existing = await db.query.complianceRules.findFirst({
    where: eq(complianceRules.code, body.code),
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      message: `规则编码 ${body.code} 已存在`,
    })
  }

  // 构建插入数据
  const ruleData: NewComplianceRule = {
    code: body.code,
    name: body.name,
    description: body.description || null,
    ruleType: body.ruleType,
    targetMetrics: body.targetMetrics ? JSON.stringify(body.targetMetrics) : null,
    targetSubModules: body.targetSubModules ? JSON.stringify(body.targetSubModules) : null,
    condition: JSON.stringify(body.condition),
    severity: body.severity || 'warning',
    regulation: body.regulation || null,
    message: body.message,
    suggestion: body.suggestion || null,
    triggerOn: body.triggerOn || 'submit',
    priority: body.priority ?? 100,
    enabled: body.enabled ?? true,
    applicablePeriods: body.applicablePeriods || 'all',
    createdBy: user.id,
  }

  // 插入数据库
  const result = await db.insert(complianceRules).values(ruleData).returning()
  const newRule = result[0]

  if (!newRule) {
    throw createError({
      statusCode: 500,
      message: '创建规则失败',
    })
  }

  // 记录审计日志
  await db.insert(complianceAuditLogs).values({
    action: 'rule_create',
    targetType: 'rule',
    targetId: newRule.id,
    afterSnapshot: JSON.stringify(newRule),
    changeDescription: `创建合规规则: ${body.name}`,
    operatorId: user.id,
  })

  return {
    success: true,
    data: {
      ...newRule,
      targetMetrics: newRule.targetMetrics ? JSON.parse(newRule.targetMetrics) : null,
      targetSubModules: newRule.targetSubModules ? JSON.parse(newRule.targetSubModules) : null,
      condition: newRule.condition ? JSON.parse(newRule.condition) : null,
    },
    message: '规则创建成功',
  }
})
