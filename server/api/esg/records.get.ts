import { db, esgRecords, esgMetrics, esgCategories, esgSubModules } from '../../database'
import { eq, and, inArray, desc, asc } from 'drizzle-orm'
import { requireViewer } from '../../utils/auth'

// 获取 ESG 记录数据
// 权限要求：所有已登录用户
export default defineEventHandler(async (event) => {
  await requireViewer(event)
  const query = getQuery(event)
  const subModuleCode = query.subModule as string | undefined
  const categoryCode = query.category as string | undefined
  const period = query.period as string | undefined
  const status = query.status as string | undefined

  // 构建查询条件
  const conditions = []

  // 按子模块筛选
  let metricIds: number[] = []
  if (subModuleCode) {
    const subModule = await db.query.esgSubModules.findFirst({
      where: eq(esgSubModules.code, subModuleCode)
    })

    if (subModule) {
      const categories = await db.query.esgCategories.findMany({
        where: eq(esgCategories.subModuleId, subModule.id)
      })

      const categoryIds = categories.map((c) => c.id)
      if (categoryIds.length > 0) {
        const metrics = await db.query.esgMetrics.findMany({
          where: inArray(esgMetrics.categoryId, categoryIds)
        })
        metricIds = metrics.map((m) => m.id)
      }
    }
  }

  // 查询记录
  let records = await db.query.esgRecords.findMany({
    orderBy: [desc(esgRecords.updatedAt)]
  })

  // 过滤
  if (metricIds.length > 0) {
    records = records.filter((r) => metricIds.includes(r.metricId))
  }
  if (period) {
    records = records.filter((r) => r.period === period)
  }
  if (status) {
    records = records.filter((r) => r.status === status)
  }

  // 获取关联的指标信息
  const allMetricIds = [...new Set(records.map((r) => r.metricId))]
  const metrics =
    allMetricIds.length > 0
      ? await db.query.esgMetrics.findMany({
        where: inArray(esgMetrics.id, allMetricIds)
      })
      : []

  const metricsMap = new Map(metrics.map((m) => [m.id, m]))

  // 组装结果
  const result = records.map((record) => {
    const metric = metricsMap.get(record.metricId)
    return {
      ...record,
      valueJson: record.valueJson ? JSON.parse(record.valueJson) : null,
      metric: metric
        ? {
          id: metric.id,
          code: metric.code,
          name: metric.name,
          fieldType: metric.fieldType,
          fieldConfig: metric.fieldConfig ? JSON.parse(metric.fieldConfig) : null
        }
        : null
    }
  })

  return {
    success: true,
    data: result,
    total: result.length
  }
})
