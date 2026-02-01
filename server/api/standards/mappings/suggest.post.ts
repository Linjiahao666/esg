import { eq, and, like, sql, desc } from 'drizzle-orm'
import {
  db,
  esgMetrics,
  esgCategories,
  esgSubModules,
  standardMetrics,
  esgStandards,
  metricMappings
} from '../../../database'

interface SuggestedMapping {
  localMetricId: number
  localMetricCode: string
  localMetricName: string
  standardMetricId: number
  standardMetricCode: string
  standardMetricName: string
  standardCode: string
  confidence: number
  matchReason: string
  mappingType: 'exact' | 'partial' | 'proxy'
}

/**
 * 智能推荐指标映射
 * POST /api/standards/mappings/suggest
 * 
 * Body:
 * - standardCode: 目标标准代码
 * - subModuleCode?: 限定子模块
 * - threshold?: 最低置信度阈值 (默认 60)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { standardCode, subModuleCode, threshold = 60 } = body
  
  if (!standardCode) {
    throw createError({
      statusCode: 400,
      message: '标准代码不能为空'
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
  
  // 获取标准指标
  const stdMetrics = await db
    .select()
    .from(standardMetrics)
    .where(eq(standardMetrics.standardId, standard.id))
  
  // 获取本地指标
  let localMetrics = await db
    .select({
      metric: esgMetrics,
      category: esgCategories,
      subModule: esgSubModules
    })
    .from(esgMetrics)
    .innerJoin(esgCategories, eq(esgMetrics.categoryId, esgCategories.id))
    .innerJoin(esgSubModules, eq(esgCategories.subModuleId, esgSubModules.id))
  
  // 筛选子模块
  if (subModuleCode) {
    localMetrics = localMetrics.filter(m => m.subModule.code === subModuleCode)
  }
  
  // 获取已存在的映射
  const existingMappings = await db
    .select()
    .from(metricMappings)
    .where(eq(metricMappings.enabled, true))
  
  const existingPairs = new Set(
    existingMappings.map(m => `${m.localMetricId}-${m.standardMetricId}`)
  )
  
  // 智能匹配
  const suggestions: SuggestedMapping[] = []
  
  for (const local of localMetrics) {
    for (const stdMetric of stdMetrics) {
      // 跳过已存在的映射
      const pairKey = `${local.metric.id}-${stdMetric.id}`
      if (existingPairs.has(pairKey)) {
        continue
      }
      
      // 计算匹配度
      const matchResult = calculateMatchScore(
        {
          code: local.metric.code,
          name: local.metric.name,
          description: local.metric.description,
          subModuleCode: local.subModule.code
        },
        {
          code: stdMetric.code,
          name: stdMetric.name,
          nameEn: stdMetric.nameEn,
          description: stdMetric.description,
          descriptionEn: stdMetric.descriptionEn
        }
      )
      
      if (matchResult.score >= threshold) {
        suggestions.push({
          localMetricId: local.metric.id,
          localMetricCode: local.metric.code,
          localMetricName: local.metric.name,
          standardMetricId: stdMetric.id,
          standardMetricCode: stdMetric.code,
          standardMetricName: stdMetric.name,
          standardCode: standard.code,
          confidence: matchResult.score,
          matchReason: matchResult.reason,
          mappingType: matchResult.mappingType
        })
      }
    }
  }
  
  // 按置信度排序
  suggestions.sort((a, b) => b.confidence - a.confidence)
  
  // 去重：每个本地指标只保留最佳匹配
  const bestMatches = new Map<number, SuggestedMapping>()
  for (const suggestion of suggestions) {
    if (!bestMatches.has(suggestion.localMetricId)) {
      bestMatches.set(suggestion.localMetricId, suggestion)
    }
  }
  
  return {
    standard: {
      code: standard.code,
      name: standard.name
    },
    totalLocalMetrics: localMetrics.length,
    totalStandardMetrics: stdMetrics.length,
    suggestions: Array.from(bestMatches.values()),
    threshold
  }
})

/**
 * 计算匹配分数
 */
function calculateMatchScore(
  local: { code: string; name: string; description?: string | null; subModuleCode: string },
  standard: { code: string; name: string; nameEn?: string | null; description?: string | null; descriptionEn?: string | null }
): { score: number; reason: string; mappingType: 'exact' | 'partial' | 'proxy' } {
  let score = 0
  const reasons: string[] = []
  
  // 1. 名称完全匹配 (+40分)
  if (local.name === standard.name || local.name === standard.nameEn) {
    score += 40
    reasons.push('名称完全匹配')
  } else {
    // 名称相似度匹配
    const nameSimilarity = calculateSimilarity(local.name, standard.name)
    const nameEnSimilarity = standard.nameEn ? calculateSimilarity(local.name, standard.nameEn) : 0
    const maxNameSim = Math.max(nameSimilarity, nameEnSimilarity)
    
    if (maxNameSim > 0.7) {
      score += Math.round(maxNameSim * 30)
      reasons.push(`名称相似度 ${Math.round(maxNameSim * 100)}%`)
    } else if (maxNameSim > 0.5) {
      score += Math.round(maxNameSim * 20)
      reasons.push(`名称部分匹配`)
    }
  }
  
  // 2. 关键词匹配 (+30分)
  const localKeywords = extractKeywords(local.name + ' ' + (local.description || ''))
  const standardKeywords = extractKeywords(
    standard.name + ' ' + (standard.nameEn || '') + ' ' + (standard.description || '') + ' ' + (standard.descriptionEn || '')
  )
  
  const keywordOverlap = calculateKeywordOverlap(localKeywords, standardKeywords)
  if (keywordOverlap > 0.5) {
    score += Math.round(keywordOverlap * 30)
    reasons.push(`关键词匹配度 ${Math.round(keywordOverlap * 100)}%`)
  }
  
  // 3. 主题/维度匹配 (+20分)
  const dimensionMatch = matchDimension(local.subModuleCode, standard.code)
  if (dimensionMatch) {
    score += 20
    reasons.push(`ESG维度匹配 (${dimensionMatch})`)
  }
  
  // 4. 代码模式匹配 (+10分)
  if (matchCodePattern(local.code, standard.code)) {
    score += 10
    reasons.push('代码模式相似')
  }
  
  // 确定映射类型
  let mappingType: 'exact' | 'partial' | 'proxy' = 'proxy'
  if (score >= 80) {
    mappingType = 'exact'
  } else if (score >= 60) {
    mappingType = 'partial'
  }
  
  return {
    score: Math.min(score, 100),
    reason: reasons.join('; '),
    mappingType
  }
}

/**
 * 计算字符串相似度 (Jaccard)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(''))
  const set2 = new Set(str2.toLowerCase().split(''))
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size
}

/**
 * 提取关键词
 */
function extractKeywords(text: string): Set<string> {
  // ESG 相关关键词映射
  const keywordMap: Record<string, string[]> = {
    'carbon': ['碳', '温室气体', 'ghg', 'co2', '碳排放'],
    'energy': ['能源', '电力', '能耗', 'electricity', 'power'],
    'water': ['水', '用水', '水资源', 'water'],
    'waste': ['废物', '废弃物', '垃圾', 'waste'],
    'emission': ['排放', '污染', 'emission', 'pollution'],
    'employee': ['员工', '雇员', '职工', 'employee', 'worker', 'staff'],
    'training': ['培训', '训练', 'training'],
    'safety': ['安全', 'safety', '健康', 'health'],
    'diversity': ['多元', '多样性', 'diversity', '性别'],
    'board': ['董事', '董事会', 'board', 'director'],
    'governance': ['治理', '公司治理', 'governance'],
    'compliance': ['合规', '合规性', 'compliance'],
    'supplier': ['供应商', '供应链', 'supplier', 'supply chain'],
    'community': ['社区', '公益', 'community', '捐赠'],
    'renewable': ['可再生', 'renewable', '清洁能源'],
  }
  
  const keywords = new Set<string>()
  const textLower = text.toLowerCase()
  
  for (const [key, synonyms] of Object.entries(keywordMap)) {
    for (const synonym of synonyms) {
      if (textLower.includes(synonym.toLowerCase())) {
        keywords.add(key)
        break
      }
    }
  }
  
  return keywords
}

/**
 * 计算关键词重叠度
 */
function calculateKeywordOverlap(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const minSize = Math.min(set1.size, set2.size)
  
  return intersection.size / minSize
}

/**
 * 匹配 ESG 维度
 */
function matchDimension(subModuleCode: string, standardCode: string): string | null {
  const localDimension = subModuleCode.charAt(0).toUpperCase()
  const standardCodeUpper = standardCode.toUpperCase()
  
  // 检查标准代码中是否包含相同维度标识
  const dimensionPatterns: Record<string, RegExp[]> = {
    'E': [/\bE\d/, /ENVIRONMENT/, /CLIMATE/, /EMISSION/, /ENERGY/, /WATER/, /WASTE/],
    'S': [/\bS\d/, /SOCIAL/, /EMPLOYEE/, /LABOR/, /HUMAN/, /COMMUNITY/, /SAFETY/],
    'G': [/\bG\d/, /GOVERNANCE/, /BOARD/, /ETHICS/, /COMPLIANCE/, /RISK/]
  }
  
  const patterns = dimensionPatterns[localDimension]
  if (patterns) {
    for (const pattern of patterns) {
      if (pattern.test(standardCodeUpper)) {
        return localDimension
      }
    }
  }
  
  return null
}

/**
 * 匹配代码模式
 */
function matchCodePattern(localCode: string, standardCode: string): boolean {
  // 提取数字部分进行比较
  const localNumbers = localCode.match(/\d+/g)?.join('.') || ''
  const standardNumbers = standardCode.match(/\d+/g)?.join('.') || ''
  
  return localNumbers === standardNumbers && localNumbers.length > 0
}
