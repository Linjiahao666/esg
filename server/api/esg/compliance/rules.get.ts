/**
 * 获取合规规则列表
 * GET /api/esg/compliance/rules
 */
import { db, complianceRules } from '../../../database'
import { eq, and, like, desc, asc } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const {
    ruleType,
    severity,
    enabled,
    search,
    page = 1,
    pageSize = 50,
    sortBy = 'priority',
    sortOrder = 'asc',
  } = query as {
    ruleType?: string
    severity?: string
    enabled?: string
    search?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }

  const conditions = []

  // 规则类型筛选
  if (ruleType) {
    conditions.push(eq(complianceRules.ruleType, ruleType))
  }

  // 严重级别筛选
  if (severity) {
    conditions.push(eq(complianceRules.severity, severity))
  }

  // 启用状态筛选
  if (enabled !== undefined) {
    conditions.push(eq(complianceRules.enabled, enabled === 'true'))
  }

  // 搜索
  if (search) {
    conditions.push(
      like(complianceRules.name, `%${search}%`)
    )
  }

  // 查询总数
  const totalResult = await db
    .select({ count: complianceRules.id })
    .from(complianceRules)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  const total = totalResult.length

  // 排序
  const orderBy =
    sortOrder === 'desc' ? desc(complianceRules[sortBy as keyof typeof complianceRules] as any) : asc(complianceRules[sortBy as keyof typeof complianceRules] as any)

  // 分页查询
  const offset = (Number(page) - 1) * Number(pageSize)
  const rules = await db
    .select()
    .from(complianceRules)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(Number(pageSize))
    .offset(offset)

  return {
    success: true,
    data: {
      items: rules.map((rule: typeof rules[0]) => ({
        ...rule,
        targetMetrics: rule.targetMetrics ? JSON.parse(rule.targetMetrics) : null,
        targetSubModules: rule.targetSubModules ? JSON.parse(rule.targetSubModules) : null,
        condition: rule.condition ? JSON.parse(rule.condition) : null,
      })),
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    },
  }
})
