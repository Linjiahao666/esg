import { db, esgRecords, esgMetrics, esgCategories, esgSubModules, esgRecordFiles } from '../../database'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { requireEntry } from '../../utils/auth'
import {
  createComplianceEngine,
  canSaveWithResults,
  extractErrorMessages,
  extractWarningMessages,
  type MetricDataInput,
} from '../../utils/compliance-engine'

// 批量保存 ESG 记录（用于表单提交）
// 权限要求：录入者(entry) 或 管理员(admin)
export default defineEventHandler(async (event) => {
  const user = await requireEntry(event)
  const body = await readBody(event)

  const { subModuleCode, period, records: recordsData, status = 'draft', skipComplianceCheck } = body

  if (!subModuleCode || !period || !recordsData) {
    throw createError({
      statusCode: 400,
      message: '请提供子模块代码、周期和记录数据'
    })
  }

  // 获取子模块
  const subModule = await db.query.esgSubModules.findFirst({
    where: eq(esgSubModules.code, subModuleCode)
  })

  if (!subModule) {
    throw createError({
      statusCode: 404,
      message: '子模块不存在'
    })
  }

  // ========== 批量合规性检查（提交前预检查） ==========
  // 根据状态决定检查触发时机
  const triggerOn = status === 'submitted' ? 'submit' : 'realtime'

  // 先获取所有指标信息
  const metricCodes = Object.keys(recordsData)
  const metrics = await db.query.esgMetrics.findMany({
    where: inArray(esgMetrics.code, metricCodes),
  })
  const metricMap = new Map(metrics.map((m) => [m.code, m]))

  // 构建检查数据
  const checkDataList: MetricDataInput[] = []
  for (const [metricCode, value] of Object.entries(recordsData)) {
    const metric = metricMap.get(metricCode)
    if (!metric) continue

    let valueNumber = null
    let valueText = null
    let valueJson = null

    if (metric.fieldType === 'number') {
      valueNumber = typeof value === 'number' ? value : parseFloat(value as string) || null
    } else if (metric.fieldType === 'select' || metric.fieldType === 'multiselect') {
      valueJson = value
    } else if (typeof value === 'object') {
      valueJson = value
    } else {
      valueText = String(value)
    }

    checkDataList.push({
      metricCode,
      value,
      valueNumber,
      valueText,
      valueJson,
      status,
    })
  }

  // 执行批量合规检查
  let complianceResult = null
  if (!skipComplianceCheck && checkDataList.length > 0) {
    const engine = createComplianceEngine(period, undefined, user.id)
    complianceResult = await engine.checkBatch(checkDataList, triggerOn)

    // 如果有error级别的失败，阻止保存
    if (!canSaveWithResults(complianceResult)) {
      throw createError({
        statusCode: 422,
        message: '合规性检查未通过，无法保存数据',
        data: {
          errors: extractErrorMessages(complianceResult),
          warnings: extractWarningMessages(complianceResult),
          details: complianceResult.errors,
          summary: {
            total: complianceResult.total,
            passed: complianceResult.passed,
            failed: complianceResult.failed,
            warnings: complianceResult.warnings,
          },
        },
      })
    }

    // 保存检查结果（只保存非通过的）
    if (complianceResult.failed > 0 || complianceResult.warnings > 0) {
      await engine.saveResults(complianceResult.results, undefined, 'auto')
    }
  }
  // ========== 合规性检查结束 ==========

  const now = new Date()
  const savedRecords = []

  // 遍历提交的记录
  for (const [metricCode, value] of Object.entries(recordsData)) {
    const metric = metricMap.get(metricCode)
    if (!metric) continue

    // 根据字段类型处理值
    let valueNumber = null
    let valueText = null
    let valueJson = null

    if (metric.fieldType === 'number') {
      valueNumber = typeof value === 'number' ? value : parseFloat(value as string) || null
    } else if (metric.fieldType === 'select' || metric.fieldType === 'multiselect') {
      valueJson = JSON.stringify(value)
    } else if (typeof value === 'object') {
      valueJson = JSON.stringify(value)
    } else {
      valueText = String(value)
    }

    // 检查是否已有记录
    const existingRecords = await db.query.esgRecords.findMany({
      where: eq(esgRecords.metricId, metric.id)
    })
    const existingRecord = existingRecords.find((r) => r.period === period)

    const recordData = {
      valueNumber,
      valueText,
      valueJson,
      status,
      updatedAt: now
    }

    let record

    if (existingRecord) {
      const result = await db
        .update(esgRecords)
        .set(recordData)
        .where(eq(esgRecords.id, existingRecord.id))
        .returning()
      record = result[0]
    } else {
      const result = await db
        .insert(esgRecords)
        .values({
          metricId: metric.id,
          period,
          ...recordData,
          submittedBy: user.id,
          submittedAt: now
        })
        .returning()
      record = result[0]
    }

    if (record) {
      savedRecords.push({
        metricCode,
        recordId: record.id
      })
    }
  }

  return {
    success: true,
    message: `成功保存 ${savedRecords.length} 条记录`,
    data: savedRecords,
    // 返回合规检查结果
    compliance: complianceResult
      ? {
        passed: complianceResult.success,
        total: complianceResult.total,
        warnings: complianceResult.warnings,
        warningMessages: complianceResult.warnings_list.map((w) => ({
          metricCode: w.metricCode,
          message: w.message,
        })),
      }
      : null,
  }
})
