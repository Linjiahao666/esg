import { eq, and, desc, asc, like, inArray } from 'drizzle-orm'
import { db, esgStandards, standardTopics, standardMetrics, disclosureRequirements } from '../../database'

/**
 * 获取国际标准列表
 * GET /api/standards
 * 
 * Query params:
 * - region: 筛选适用地区 (CN, EU, US, global)
 * - type: 标准类型 (framework, regulation, guideline)
 * - status: 状态 (active, draft)
 * - includeMetrics: 是否包含指标数量统计
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  const region = query.region as string | undefined
  const standardType = query.type as string | undefined
  const status = query.status as string | undefined
  const includeMetrics = query.includeMetrics === 'true'
  
  // 构建查询条件
  const conditions = []
  
  if (status) {
    conditions.push(eq(esgStandards.status, status))
  } else {
    conditions.push(eq(esgStandards.status, 'active'))
  }
  
  if (standardType) {
    conditions.push(eq(esgStandards.standardType, standardType))
  }
  
  // 查询标准列表
  let standards = await db
    .select()
    .from(esgStandards)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(esgStandards.sortOrder), asc(esgStandards.code))
  
  // 按地区筛选 (JSON数组字段)
  if (region) {
    standards = standards.filter(s => {
      const regions = JSON.parse(s.applicableRegions || '[]')
      return regions.includes(region) || regions.includes('global')
    })
  }
  
  // 如果需要包含指标统计
  if (includeMetrics) {
    const standardIds = standards.map(s => s.id)
    
    if (standardIds.length > 0) {
      // 获取每个标准的指标数量
      const metricsCount = await db
        .select({
          standardId: standardMetrics.standardId,
        })
        .from(standardMetrics)
        .where(inArray(standardMetrics.standardId, standardIds))
      
      // 获取每个标准的披露要求数量
      const disclosuresCount = await db
        .select({
          standardId: disclosureRequirements.standardId,
        })
        .from(disclosureRequirements)
        .where(inArray(disclosureRequirements.standardId, standardIds))
      
      // 统计数量
      const metricsMap = new Map<number, number>()
      const disclosuresMap = new Map<number, number>()
      
      metricsCount.forEach(m => {
        metricsMap.set(m.standardId, (metricsMap.get(m.standardId) || 0) + 1)
      })
      
      disclosuresCount.forEach(d => {
        disclosuresMap.set(d.standardId, (disclosuresMap.get(d.standardId) || 0) + 1)
      })
      
      return standards.map(s => ({
        ...s,
        applicableRegions: JSON.parse(s.applicableRegions || '[]'),
        config: s.config ? JSON.parse(s.config) : null,
        metricsCount: metricsMap.get(s.id) || 0,
        disclosuresCount: disclosuresMap.get(s.id) || 0
      }))
    }
  }
  
  return standards.map(s => ({
    ...s,
    applicableRegions: JSON.parse(s.applicableRegions || '[]'),
    config: s.config ? JSON.parse(s.config) : null
  }))
})
