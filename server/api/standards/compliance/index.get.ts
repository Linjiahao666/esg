import { eq, and, inArray } from 'drizzle-orm'
import {
  db,
  companyStandardConfigs,
  standardComplianceTracking,
  esgStandards,
  standardMetrics,
  metricMappings,
  esgRecords,
  esgMetrics
} from '../../../database'

/**
 * 获取企业标准合规追踪
 * GET /api/standards/compliance
 * 
 * Query params:
 * - standardCode: 标准代码
 * - period: 报告周期
 * - orgUnitId?: 组织单位ID
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  const standardCode = query.standardCode as string
  const period = query.period as string
  const orgUnitId = query.orgUnitId ? Number(query.orgUnitId) : undefined
  
  if (!standardCode || !period) {
    throw createError({
      statusCode: 400,
      message: '标准代码和报告周期不能为空'
    })
  }
  
  // 获取标准信息
  const [standard] = await db
    .select()
    .from(esgStandards)
    .where(eq(esgStandards.code, standardCode))
    .limit(1)
  
  if (!standard) {
    throw createError({
      statusCode: 404,
      message: `未找到标准: ${standardCode}`
    })
  }
  
  // 获取企业对该标准的配置
  const configConditions = [eq(companyStandardConfigs.standardId, standard.id)]
  if (orgUnitId) {
    configConditions.push(eq(companyStandardConfigs.orgUnitId, orgUnitId))
  }
  
  const [companyConfig] = await db
    .select()
    .from(companyStandardConfigs)
    .where(and(...configConditions))
    .limit(1)
  
  // 获取标准的所有指标
  const stdMetrics = await db
    .select()
    .from(standardMetrics)
    .where(eq(standardMetrics.standardId, standard.id))
    .orderBy(standardMetrics.sortOrder)
  
  // 获取指标映射关系
  const mappings = await db
    .select()
    .from(metricMappings)
    .where(
      and(
        inArray(metricMappings.standardMetricId, stdMetrics.map(m => m.id)),
        eq(metricMappings.enabled, true)
      )
    )
  
  // 获取本地指标的数据记录
  const localMetricIds = mappings.map(m => m.localMetricId)
  let records: any[] = []
  
  if (localMetricIds.length > 0) {
    const recordConditions = [
      inArray(esgRecords.metricId, localMetricIds),
      eq(esgRecords.period, period)
    ]
    if (orgUnitId) {
      recordConditions.push(eq(esgRecords.orgUnitId, orgUnitId))
    }
    
    records = await db
      .select({
        record: esgRecords,
        metric: esgMetrics
      })
      .from(esgRecords)
      .innerJoin(esgMetrics, eq(esgRecords.metricId, esgMetrics.id))
      .where(and(...recordConditions))
  }
  
  // 构建映射索引
  const mappingByStdMetric = new Map<number, typeof mappings[0]>()
  mappings.forEach(m => {
    mappingByStdMetric.set(m.standardMetricId, m)
  })
  
  const recordByLocalMetric = new Map<number, typeof records[0]>()
  records.forEach(r => {
    recordByLocalMetric.set(r.metric.id, r)
  })
  
  // 计算每个标准指标的完成状态
  const complianceItems = stdMetrics.map(stdMetric => {
    const mapping = mappingByStdMetric.get(stdMetric.id)
    const record = mapping ? recordByLocalMetric.get(mapping.localMetricId) : null
    
    let status: 'completed' | 'in_progress' | 'not_started' | 'not_mapped' = 'not_mapped'
    let completionRate = 0
    let dataQuality: 'high' | 'medium' | 'low' | null = null
    let localMetricCode: string | null = null
    let localValue: any = null
    
    if (mapping) {
      localMetricCode = record?.metric.code || null
      
      if (record) {
        const hasValue = record.record.valueNumber !== null || 
                        record.record.valueText !== null || 
                        record.record.valueJson !== null
        
        if (hasValue) {
          if (record.record.status === 'approved') {
            status = 'completed'
            completionRate = 100
            dataQuality = 'high'
          } else if (record.record.status === 'submitted') {
            status = 'in_progress'
            completionRate = 80
            dataQuality = 'medium'
          } else {
            status = 'in_progress'
            completionRate = 50
            dataQuality = 'low'
          }
          
          localValue = record.record.valueNumber ?? record.record.valueText ?? 
                      (record.record.valueJson ? JSON.parse(record.record.valueJson) : null)
        } else {
          status = 'not_started'
        }
      } else {
        status = 'not_started'
      }
    }
    
    return {
      standardMetric: {
        id: stdMetric.id,
        code: stdMetric.code,
        name: stdMetric.name,
        nameEn: stdMetric.nameEn,
        disclosureLevel: stdMetric.disclosureLevel,
        dataType: stdMetric.dataType,
        unit: stdMetric.unit
      },
      mapping: mapping ? {
        id: mapping.id,
        mappingType: mapping.mappingType,
        confidence: mapping.confidence,
        localMetricCode
      } : null,
      compliance: {
        status,
        completionRate,
        dataQuality,
        localValue
      }
    }
  })
  
  // 计算统计信息
  const stats = {
    total: complianceItems.length,
    mandatory: complianceItems.filter(i => i.standardMetric.disclosureLevel === 'mandatory').length,
    completed: complianceItems.filter(i => i.compliance.status === 'completed').length,
    inProgress: complianceItems.filter(i => i.compliance.status === 'in_progress').length,
    notStarted: complianceItems.filter(i => i.compliance.status === 'not_started').length,
    notMapped: complianceItems.filter(i => i.compliance.status === 'not_mapped').length,
    mandatoryCompleted: complianceItems.filter(
      i => i.standardMetric.disclosureLevel === 'mandatory' && i.compliance.status === 'completed'
    ).length
  }
  
  const overallComplianceRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0
  
  const mandatoryComplianceRate = stats.mandatory > 0
    ? Math.round((stats.mandatoryCompleted / stats.mandatory) * 100)
    : 100
  
  return {
    standard: {
      id: standard.id,
      code: standard.code,
      name: standard.name,
      version: standard.version
    },
    period,
    companyConfig: companyConfig ? {
      id: companyConfig.id,
      adoptionStatus: companyConfig.adoptionStatus,
      firstAdoptionYear: companyConfig.firstAdoptionYear,
      targetComplianceYear: companyConfig.targetComplianceYear,
      isPrimary: companyConfig.isPrimary
    } : null,
    statistics: {
      ...stats,
      overallComplianceRate,
      mandatoryComplianceRate
    },
    items: complianceItems
  }
})
