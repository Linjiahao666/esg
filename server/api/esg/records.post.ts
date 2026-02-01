import { db, esgRecords, esgMetrics } from '../../database'
import { eq } from 'drizzle-orm'
import { requireEntry } from '../../utils/auth'
import {
  createComplianceEngine,
  canSaveWithResults,
  extractErrorMessages,
  type MetricDataInput,
} from '../../utils/compliance-engine'

// 创建或更新 ESG 记录
// 权限要求：录入者(entry) 或 管理员(admin)
export default defineEventHandler(async (event) => {
  const user = await requireEntry(event)
  const body = await readBody(event)

  const {
    metricId,
    period,
    orgUnitId,
    valueNumber,
    valueText,
    valueJson,
    remark,
    status,
    skipComplianceCheck,
  } = body

  if (!metricId || !period) {
    throw createError({
      statusCode: 400,
      message: '请提供指标ID和周期'
    })
  }

  // 验证指标存在
  const metric = await db.query.esgMetrics.findFirst({
    where: eq(esgMetrics.id, metricId)
  })

  if (!metric) {
    throw createError({
      statusCode: 404,
      message: '指标不存在'
    })
  }

  // ========== 合规性检查 ==========
  // 根据状态决定检查触发时机：draft用realtime，submit用submit
  const triggerOn = status === 'submitted' ? 'submit' : 'realtime'

  // 构建检查数据
  const checkData: MetricDataInput = {
    metricCode: metric.code,
    value: valueNumber ?? valueText ?? valueJson,
    valueNumber: valueNumber ?? null,
    valueText: valueText ?? null,
    valueJson: valueJson,
    status,
  }

  // 执行合规检查（除非明确跳过）
  let complianceResult = null
  if (!skipComplianceCheck) {
    const engine = createComplianceEngine(period, orgUnitId, user.id)
    complianceResult = await engine.checkRecord(checkData, triggerOn)

    // 如果有error级别的失败，阻止保存
    if (!canSaveWithResults(complianceResult)) {
      throw createError({
        statusCode: 422,
        message: '合规性检查未通过',
        data: {
          errors: extractErrorMessages(complianceResult),
          details: complianceResult.errors,
        },
      })
    }

    // 保存检查结果（只保存非通过的）
    if (complianceResult.failed > 0 || complianceResult.warnings > 0) {
      await engine.saveResults(complianceResult.results, undefined, 'auto')
    }
  }
  // ========== 合规性检查结束 ==========

  // 检查是否已有记录（同指标+同周期+同组织）
  const existingRecords = await db.query.esgRecords.findMany({
    where: eq(esgRecords.metricId, metricId)
  })

  const existingRecord = existingRecords.find(
    (r) => r.period === period && r.orgUnitId === (orgUnitId || null)
  )

  const now = new Date()
  const recordData = {
    valueNumber: valueNumber ?? null,
    valueText: valueText ?? null,
    valueJson: valueJson ? JSON.stringify(valueJson) : null,
    remark: remark ?? null,
    status: status || 'draft',
    updatedAt: now
  }

  let record

  if (existingRecord) {
    // 更新记录
    const result = await db
      .update(esgRecords)
      .set(recordData)
      .where(eq(esgRecords.id, existingRecord.id))
      .returning()

    record = result[0]
  } else {
    // 创建新记录
    const result = await db
      .insert(esgRecords)
      .values({
        metricId,
        period,
        orgUnitId: orgUnitId || null,
        ...recordData,
        submittedBy: user.id,
        submittedAt: now
      })
      .returning()

    record = result[0]
  }

  return {
    success: true,
    message: existingRecord ? '更新成功' : '创建成功',
    data: record,
    // 返回合规检查结果（如果有警告）
    compliance: complianceResult
      ? {
        passed: complianceResult.success,
        warnings: complianceResult.warnings,
        warningMessages: complianceResult.warnings_list.map((w) => w.message),
      }
      : null,
  }
})
