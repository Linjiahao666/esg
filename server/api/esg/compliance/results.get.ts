/**
 * 获取合规检查结果列表
 * GET /api/esg/compliance/results
 */
import { db, complianceResults, complianceRules } from '../../../database'
import { eq, and, desc, like, inArray } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const {
    period,
    status,
    resolveStatus,
    severity,
    metricCode,
    ruleId,
    page = 1,
    pageSize = 50,
  } = query as {
    period?: string
    status?: string
    resolveStatus?: string
    severity?: string
    metricCode?: string
    ruleId?: string
    page?: number
    pageSize?: number
  }

  const conditions = []

  // 周期筛选
  if (period) {
    conditions.push(eq(complianceResults.period, period))
  }

  // 检查状态筛选
  if (status) {
    conditions.push(eq(complianceResults.status, status))
  }

  // 解决状态筛选
  if (resolveStatus) {
    conditions.push(eq(complianceResults.resolveStatus, resolveStatus))
  }

  // 指标代码筛选
  if (metricCode) {
    conditions.push(like(complianceResults.metricCode, `%${metricCode}%`))
  }

  // 规则ID筛选
  if (ruleId) {
    conditions.push(eq(complianceResults.ruleId, parseInt(ruleId)))
  }

  // 严重级别筛选（需要join规则表）
  let severityRuleIds: number[] = []
  if (severity) {
    const rulesWithSeverity = await db
      .select({ id: complianceRules.id })
      .from(complianceRules)
      .where(eq(complianceRules.severity, severity))
    severityRuleIds = rulesWithSeverity.map((r) => r.id)
    if (severityRuleIds.length > 0) {
      conditions.push(inArray(complianceResults.ruleId, severityRuleIds))
    }
  }

  // 查询总数
  const totalResult = await db
    .select({ count: complianceResults.id })
    .from(complianceResults)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  const total = totalResult.length

  // 分页查询
  const offset = (Number(page) - 1) * Number(pageSize)
  const results = await db
    .select({
      result: complianceResults,
      rule: {
        code: complianceRules.code,
        name: complianceRules.name,
        severity: complianceRules.severity,
        regulation: complianceRules.regulation,
        suggestion: complianceRules.suggestion,
      },
    })
    .from(complianceResults)
    .leftJoin(complianceRules, eq(complianceResults.ruleId, complianceRules.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(complianceResults.checkedAt))
    .limit(Number(pageSize))
    .offset(offset)

  // 统计各状态数量
  const stats = {
    total: 0,
    pending: 0,
    resolved: 0,
    ignored: 0,
    deferred: 0,
    fail: 0,
    warning: 0,
    pass: 0,
  }

  const allResults = await db
    .select({
      status: complianceResults.status,
      resolveStatus: complianceResults.resolveStatus,
    })
    .from(complianceResults)
    .where(period ? eq(complianceResults.period, period) : undefined)

  for (const r of allResults) {
    stats.total++
    if (r.status === 'fail') stats.fail++
    if (r.status === 'warning') stats.warning++
    if (r.status === 'pass') stats.pass++
    if (r.resolveStatus === 'pending') stats.pending++
    if (r.resolveStatus === 'resolved') stats.resolved++
    if (r.resolveStatus === 'ignored') stats.ignored++
    if (r.resolveStatus === 'deferred') stats.deferred++
  }

  return {
    success: true,
    data: {
      items: results.map(({ result, rule }) => ({
        ...result,
        details: result.details ? JSON.parse(result.details) : null,
        rule,
      })),
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
      stats,
    },
  }
})
