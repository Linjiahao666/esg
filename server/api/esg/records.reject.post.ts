/**
 * ESG 记录审核退回 API
 * 
 * 权限要求：审计者(auditor) 或 管理员(admin)
 */

import { db, esgRecords } from '../../database'
import { eq, inArray } from 'drizzle-orm'
import { requireAuditor } from '../../utils/auth'

interface RejectRequest {
  recordIds: number[]      // 要退回的记录ID列表
  reason: string           // 退回原因（必填）
}

export default defineEventHandler(async (event) => {
  // 验证审计者权限
  const user = await requireAuditor(event)

  const body = await readBody<RejectRequest>(event)

  if (!body.recordIds || !Array.isArray(body.recordIds) || body.recordIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: '请提供要退回的记录ID列表'
    })
  }

  if (!body.reason || body.reason.trim() === '') {
    throw createError({
      statusCode: 400,
      message: '请提供退回原因'
    })
  }

  // 获取要退回的记录
  const records = await db.query.esgRecords.findMany({
    where: inArray(esgRecords.id, body.recordIds)
  })

  if (records.length === 0) {
    throw createError({
      statusCode: 404,
      message: '未找到指定的记录'
    })
  }

  // 验证记录状态：只有已提交的记录可以被退回
  const invalidRecords = records.filter(r => r.status !== 'submitted')
  if (invalidRecords.length > 0) {
    throw createError({
      statusCode: 400,
      message: `以下记录不在"已提交"状态，无法退回：${invalidRecords.map(r => r.id).join(', ')}`
    })
  }

  const now = new Date()
  const results = {
    rejected: 0,
    failed: 0,
    errors: [] as string[]
  }

  // 批量更新记录状态
  for (const record of records) {
    try {
      await db.update(esgRecords)
        .set({
          status: 'rejected',
          approvedBy: user.id,    // 记录退回人
          approvedAt: now,
          remark: `${record.remark || ''}\n[审核退回] ${body.reason}`.trim(),
          updatedAt: now
        })
        .where(eq(esgRecords.id, record.id))

      results.rejected++
    } catch (error: any) {
      results.failed++
      results.errors.push(`记录 ${record.id}: ${error.message}`)
    }
  }

  return {
    success: results.failed === 0,
    message: `退回完成: ${results.rejected} 条退回, ${results.failed} 条失败`,
    data: results
  }
})
