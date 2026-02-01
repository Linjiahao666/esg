/**
 * 执行合规检查
 * POST /api/esg/compliance/check
 *
 * 支持三种检查模式：
 * 1. single - 检查单条记录
 * 2. batch - 检查多条记录
 * 3. period - 检查整个周期的所有数据
 */
import { db, esgRecords, esgMetrics } from '../../../database'
import { eq, and, inArray } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import {
  createComplianceEngine,
  type MetricDataInput,
  type TriggerOn,
} from '../../../utils/compliance-engine'

interface CheckBody {
  mode: 'single' | 'batch' | 'period'
  triggerOn?: TriggerOn
  period: string
  orgUnitId?: number
  saveResults?: boolean
  // single mode
  metricCode?: string
  value?: any
  valueNumber?: number | null
  valueText?: string | null
  valueJson?: any
  // batch mode
  records?: MetricDataInput[]
  // period mode
  subModuleCodes?: string[]
  metricCodes?: string[]
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<CheckBody>(event)

  // 验证必填字段
  if (!body.mode || !body.period) {
    throw createError({
      statusCode: 400,
      message: '缺少必填字段: mode, period',
    })
  }

  const engine = createComplianceEngine(body.period, body.orgUnitId, user.id)
  const triggerOn = body.triggerOn || 'submit'

  let result

  switch (body.mode) {
    case 'single': {
      // 单条记录检查
      if (!body.metricCode) {
        throw createError({
          statusCode: 400,
          message: 'single 模式需要提供 metricCode',
        })
      }

      const data: MetricDataInput = {
        metricCode: body.metricCode,
        value: body.value,
        valueNumber: body.valueNumber,
        valueText: body.valueText,
        valueJson: body.valueJson,
      }

      result = await engine.checkRecord(data, triggerOn)
      break
    }

    case 'batch': {
      // 批量记录检查
      if (!body.records || body.records.length === 0) {
        throw createError({
          statusCode: 400,
          message: 'batch 模式需要提供 records 数组',
        })
      }

      result = await engine.checkBatch(body.records, triggerOn)
      break
    }

    case 'period': {
      // 周期全量检查
      // 从数据库获取该周期的所有记录
      const conditions = [eq(esgRecords.period, body.period)]

      if (body.orgUnitId) {
        conditions.push(eq(esgRecords.orgUnitId, body.orgUnitId))
      }

      // 如果指定了子模块或指标代码，需要过滤
      let metricIds: number[] = []
      if (body.metricCodes && body.metricCodes.length > 0) {
        const metrics = await db
          .select({ id: esgMetrics.id })
          .from(esgMetrics)
          .where(inArray(esgMetrics.code, body.metricCodes))
        metricIds = metrics.map((m) => m.id)
      }

      if (metricIds.length > 0) {
        conditions.push(inArray(esgRecords.metricId, metricIds))
      }

      const records = await db
        .select({
          id: esgRecords.id,
          metricId: esgRecords.metricId,
          valueNumber: esgRecords.valueNumber,
          valueText: esgRecords.valueText,
          valueJson: esgRecords.valueJson,
          status: esgRecords.status,
        })
        .from(esgRecords)
        .where(and(...conditions))

      // 获取指标代码映射
      const allMetricIds = [...new Set(records.map((r) => r.metricId))]
      const metrics = await db
        .select({ id: esgMetrics.id, code: esgMetrics.code })
        .from(esgMetrics)
        .where(inArray(esgMetrics.id, allMetricIds))

      const metricCodeMap = new Map(metrics.map((m) => [m.id, m.code]))

      // 转换为检查输入格式
      const checkData: MetricDataInput[] = records.map((r) => ({
        metricCode: metricCodeMap.get(r.metricId) || '',
        value: r.valueNumber ?? r.valueText ?? r.valueJson,
        valueNumber: r.valueNumber,
        valueText: r.valueText,
        valueJson: r.valueJson ? JSON.parse(r.valueJson) : undefined,
        status: r.status || undefined,
      }))

      result = await engine.checkBatch(checkData, triggerOn)
      break
    }

    default:
      throw createError({
        statusCode: 400,
        message: '无效的检查模式',
      })
  }

  // 保存检查结果
  if (body.saveResults && result.results.length > 0) {
    await engine.saveResults(result.results, undefined, 'manual')

    // 记录审计日志
    await engine.logAudit(
      'check',
      'batch',
      undefined,
      undefined,
      {
        mode: body.mode,
        period: body.period,
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        warnings: result.warnings,
      },
      `执行合规检查: ${body.mode} 模式, 周期 ${body.period}`
    )
  }

  return {
    success: true,
    data: {
      ...result,
      // 简化结果，只返回非通过的详细信息
      results: undefined,
      summary: {
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        warnings: result.warnings,
        skipped: result.skipped,
        passRate: result.total > 0 ? ((result.passed / result.total) * 100).toFixed(2) + '%' : '0%',
      },
      errors: result.errors,
      warnings: result.warnings_list,
    },
  }
})
