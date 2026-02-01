/**
 * 删除合规规则
 * DELETE /api/esg/compliance/rules/[id]
 */
import { db, complianceRules, complianceResults, complianceAuditLogs } from '../../../../database'
import { eq, count } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '')

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

  // 检查是否有关联的检查结果
  const resultsCount = await db
    .select({ count: count() })
    .from(complianceResults)
    .where(eq(complianceResults.ruleId, id))

  const countResult = resultsCount[0]?.count ?? 0

  if (countResult > 0) {
    // 如果有关联结果，只禁用规则而不删除
    await db
      .update(complianceRules)
      .set({ enabled: false, updatedAt: new Date() })
      .where(eq(complianceRules.id, id))

    // 记录审计日志
    await db.insert(complianceAuditLogs).values({
      action: 'rule_disable',
      targetType: 'rule',
      targetId: id,
      beforeSnapshot: JSON.stringify(existing),
      changeDescription: `禁用合规规则: ${existing.name} (有 ${countResult} 条关联检查结果)`,
      operatorId: user.id,
    })

    return {
      success: true,
      message: `规则已禁用 (有 ${countResult} 条关联检查结果，无法删除)`,
    }
  }

  // 删除规则
  await db.delete(complianceRules).where(eq(complianceRules.id, id))

  // 记录审计日志
  await db.insert(complianceAuditLogs).values({
    action: 'rule_delete',
    targetType: 'rule',
    targetId: id,
    beforeSnapshot: JSON.stringify(existing),
    changeDescription: `删除合规规则: ${existing.name}`,
    operatorId: user.id,
  })

  return {
    success: true,
    message: '规则删除成功',
  }
})
