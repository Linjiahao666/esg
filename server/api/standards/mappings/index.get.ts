import { eq, and, desc, asc, like, inArray, sql } from 'drizzle-orm'
import {
  db,
  metricMappings,
  esgMetrics,
  esgCategories,
  esgSubModules,
  standardMetrics,
  esgStandards
} from '../../../database'

/**
 * 获取指标映射列表
 * GET /api/standards/mappings
 * 
 * Query params:
 * - standardCode: 标准代码
 * - subModuleCode: 本地子模块代码 (E1, S1 等)
 * - mappingType: 映射类型
 * - verified: 是否已验证 (true/false)
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  const standardCode = query.standardCode as string | undefined
  const subModuleCode = query.subModuleCode as string | undefined
  const mappingType = query.mappingType as string | undefined
  const verified = query.verified as string | undefined
  
  // 获取所有映射关系（带关联信息）
  let mappingsQuery = db
    .select({
      mapping: metricMappings,
      localMetric: {
        id: esgMetrics.id,
        code: esgMetrics.code,
        name: esgMetrics.name,
        fieldType: esgMetrics.fieldType,
        fieldConfig: esgMetrics.fieldConfig
      },
      standardMetric: {
        id: standardMetrics.id,
        code: standardMetrics.code,
        name: standardMetrics.name,
        nameEn: standardMetrics.nameEn,
        disclosureLevel: standardMetrics.disclosureLevel,
        dataType: standardMetrics.dataType,
        unit: standardMetrics.unit
      },
      standard: {
        id: esgStandards.id,
        code: esgStandards.code,
        name: esgStandards.name
      }
    })
    .from(metricMappings)
    .innerJoin(esgMetrics, eq(metricMappings.localMetricId, esgMetrics.id))
    .innerJoin(standardMetrics, eq(metricMappings.standardMetricId, standardMetrics.id))
    .innerJoin(esgStandards, eq(standardMetrics.standardId, esgStandards.id))
  
  // 应用筛选条件
  const conditions = []
  
  if (standardCode) {
    conditions.push(eq(esgStandards.code, standardCode))
  }
  
  if (mappingType) {
    conditions.push(eq(metricMappings.mappingType, mappingType))
  }
  
  if (verified !== undefined) {
    conditions.push(eq(metricMappings.isVerified, verified === 'true'))
  }
  
  const results = await mappingsQuery
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(esgMetrics.code))
  
  // 如果需要按子模块筛选，获取子模块下的所有指标
  let filteredResults = results
  if (subModuleCode) {
    // 获取子模块下的所有分类
    const subModule = await db
      .select()
      .from(esgSubModules)
      .where(eq(esgSubModules.code, subModuleCode))
      .limit(1)
    
    if (subModule.length > 0) {
      const categories = await db
        .select()
        .from(esgCategories)
        .where(eq(esgCategories.subModuleId, subModule[0].id))
      
      const categoryIds = categories.map(c => c.id)
      
      // 获取这些分类下的所有指标
      const metricsInSubModule = await db
        .select({ id: esgMetrics.id })
        .from(esgMetrics)
        .where(inArray(esgMetrics.categoryId, categoryIds))
      
      const metricIds = new Set(metricsInSubModule.map(m => m.id))
      filteredResults = results.filter(r => metricIds.has(r.localMetric.id))
    }
  }
  
  // 格式化返回数据
  return filteredResults.map(r => ({
    id: r.mapping.id,
    mappingType: r.mapping.mappingType,
    confidence: r.mapping.confidence,
    transformationNotes: r.mapping.transformationNotes,
    transformationFormula: r.mapping.transformationFormula 
      ? JSON.parse(r.mapping.transformationFormula) 
      : null,
    unitConversionFactor: r.mapping.unitConversionFactor,
    dataDifferenceNotes: r.mapping.dataDifferenceNotes,
    requiresAdditionalData: r.mapping.requiresAdditionalData,
    additionalDataNotes: r.mapping.additionalDataNotes,
    isAutoMapped: r.mapping.isAutoMapped,
    isVerified: r.mapping.isVerified,
    enabled: r.mapping.enabled,
    localMetric: {
      ...r.localMetric,
      fieldConfig: r.localMetric.fieldConfig 
        ? JSON.parse(r.localMetric.fieldConfig) 
        : null
    },
    standardMetric: r.standardMetric,
    standard: r.standard
  }))
})
