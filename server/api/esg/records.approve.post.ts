/**
 * ESG 记录审核通过 API
 * 
 * 权限要求：审计者(auditor) 或 管理员(admin)
 */

import { db, esgRecords } from '../../database'
import { eq, inArray } from 'drizzle-orm'
import { requireAuditor } from '../../utils/auth'

interface ApproveRequest {
  recordIds: number[]      // 要审核的记录ID列表
  remark?: string          // 审核备注
}

export default defineEventHandler(async (event) => {
  // 验证审计者权限
  const user = await requireAuditor(event)

  const body = await readBody<ApproveRequest>(event)

  if (!body.recordIds || !Array.isArray(body.recordIds) || body.recordIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: '请提供要审核的记录ID列表'
    })
  }

  // 获取要审核的记录
  const records = await db.query.esgRecords.findMany({
    where: inArray(esgRecords.id, body.recordIds)
  })

  if (records.length === 0) {
    throw createError({
      statusCode: 404,
      message: '未找到指定的记录'
    })
  }

  // 验证记录状态：只有已提交的记录可以被审核
  const invalidRecords = records.filter(r => r.status !== 'submitted')
  if (invalidRecords.length > 0) {
    throw createError({
      statusCode: 400,
      message: `以下记录不在"已提交"状态，无法审核：${invalidRecords.map(r => r.id).join(', ')}`
    })
  }

  const now = new Date()
  const results = {
    approved: 0,
    failed: 0,
    errors: [] as string[]
  }

  // 批量更新记录状态
  for (const record of records) {
    try {
      await db.update(esgRecords)
        .set({
          status: 'approved',
          approvedBy: user.id,
          approvedAt: now,
          remark: body.remark ? `${record.remark || ''}\n[审核通过] ${body.remark}`.trim() : record.remark,
          updatedAt: now
        })
        .where(eq(esgRecords.id, record.id))

      results.approved++
    } catch (error: any) {
      results.failed++
      results.errors.push(`记录 ${record.id}: ${error.message}`)
    }
  }

  return {
    success: results.failed === 0,
    message: `审核完成: ${results.approved} 条通过, ${results.failed} 条失败`,
    data: results
  }
})
