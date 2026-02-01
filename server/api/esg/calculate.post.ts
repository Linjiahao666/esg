/**
 * ESG 指标计算 API
 * 
 * 根据原始数据自动计算 ESG 指标值
 * 权限要求：审计者(auditor) 或 管理员(admin)
 */

import { CalculationEngine, calculateAllMetrics, PREDEFINED_FORMULAS } from '../../utils/calculation-engine'
import { db, esgRecords, esgMetrics } from '../../database'
import { eq, and } from 'drizzle-orm'
import { requireAuditor } from '../../utils/auth'

interface CalculateRequest {
  period: string
  metricCodes?: string[]  // 指定要计算的指标，为空则计算所有
  saveResults?: boolean   // 是否保存计算结果到 esgRecords
}

export default defineEventHandler(async (event) => {
  try {
    // 审计者或管理员才能执行计算
    await requireAuditor(event)
    const body = await readBody<CalculateRequest>(event)

    if (!body.period) {
      return { success: false, message: '请指定计算周期' }
    }

    const engine = new CalculationEngine(body.period)
    const results: Record<string, any> = {}
    const errors: string[] = []

    // 如果指定了指标代码，只计算这些指标
    if (body.metricCodes && body.metricCodes.length > 0) {
      for (const code of body.metricCodes) {
        const result = await engine.calculateMetric(code)
        results[code] = result
        if (!result.success) {
          errors.push(`${code}: ${result.error}`)
        }
      }
    } else {
      // 计算所有有公式的指标
      const allResults = await calculateAllMetrics(body.period)
      Object.assign(results, allResults)

      for (const [code, result] of Object.entries(allResults)) {
        if (!result.success) {
          errors.push(`${code}: ${result.error}`)
        }
      }
    }

    // 保存计算结果
    if (body.saveResults) {
      for (const [code, result] of Object.entries(results)) {
        if (result.success && result.value !== undefined) {
          const metric = await db.query.esgMetrics.findFirst({
            where: eq(esgMetrics.code, code)
          })

          if (metric) {
            // 检查是否已存在记录
            const existingRecord = await db.query.esgRecords.findFirst({
              where: and(
                eq(esgRecords.metricId, metric.id),
                eq(esgRecords.period, body.period)
              )
            })

            const recordData = {
              metricId: metric.id,
              period: body.period,
              valueNumber: typeof result.value === 'number' ? result.value : null,
              valueText: typeof result.value === 'string' ? result.value : null,
              valueJson: JSON.stringify({
                calculated: true,
                calculatedAt: new Date().toISOString(),
                details: result.details
              }),
              status: 'draft' as const
            }

            if (existingRecord) {
              await db.update(esgRecords)
                .set(recordData)
                .where(eq(esgRecords.id, existingRecord.id))
            } else {
              await db.insert(esgRecords).values(recordData)
            }
          }
        }
      }
    }

    return {
      success: true,
      period: body.period,
      calculated: Object.keys(results).length,
      successful: Object.values(results).filter(r => r.success).length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (e: any) {
    console.error('计算失败:', e)
    return { success: false, message: e.message || '计算失败' }
  }
})
