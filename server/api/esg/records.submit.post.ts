/**
 * ESG 记录提交审核 API
 * 
 * 权限要求：录入者(entry) 或 管理员(admin)
 */

import { db, esgRecords } from '../../database'
import { eq, inArray } from 'drizzle-orm'
import { requireEntry } from '../../utils/auth'

interface SubmitRequest {
  recordIds: number[]      // 要提交的记录ID列表
}

export default defineEventHandler(async (event) => {
  // 验证录入者权限
  const user = await requireEntry(event)

  const body = await readBody<SubmitRequest>(event)

  if (!body.recordIds || !Array.isArray(body.recordIds) || body.recordIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: '请提供要提交的记录ID列表'
    })
  }

  // 获取要提交的记录
  const records = await db.query.esgRecords.findMany({
    where: inArray(esgRecords.id, body.recordIds)
  })

  if (records.length === 0) {
    throw createError({
      statusCode: 404,
      message: '未找到指定的记录'
    })
  }

  // 验证记录状态：只有草稿或退回的记录可以提交
  const invalidRecords = records.filter(r => r.status !== 'draft' && r.status !== 'rejected')
  if (invalidRecords.length > 0) {
    throw createError({
      statusCode: 400,
      message: `以下记录状态不允许提交：${invalidRecords.map(r => `${r.id}(${r.status})`).join(', ')}`
    })
  }

  const now = new Date()
  const results = {
    submitted: 0,
    failed: 0,
    errors: [] as string[]
  }

  // 批量更新记录状态
  for (const record of records) {
    try {
      await db.update(esgRecords)
        .set({
          status: 'submitted',
          submittedBy: user.id,
          submittedAt: now,
          updatedAt: now
        })
        .where(eq(esgRecords.id, record.id))

      results.submitted++
    } catch (error: any) {
      results.failed++
      results.errors.push(`记录 ${record.id}: ${error.message}`)
    }
  }

  return {
    success: results.failed === 0,
    message: `提交完成: ${results.submitted} 条提交成功, ${results.failed} 条失败`,
    data: results
  }
})
