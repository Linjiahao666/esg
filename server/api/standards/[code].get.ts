import { eq } from 'drizzle-orm'
import { db, esgStandards, standardTopics, standardMetrics, disclosureRequirements } from '../../database'

/**
 * 获取标准详情
 * GET /api/standards/:code
 * 
 * 返回标准的完整信息，包括主题、指标和披露要求
 */
export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  
  if (!code) {
    throw createError({
      statusCode: 400,
      message: '标准代码不能为空'
    })
  }
  
  // 获取标准基本信息
  const [standard] = await db
    .select()
    .from(esgStandards)
    .where(eq(esgStandards.code, code))
    .limit(1)
  
  if (!standard) {
    throw createError({
      statusCode: 404,
      message: `未找到标准: ${code}`
    })
  }
  
  // 获取标准主题
  const topics = await db
    .select()
    .from(standardTopics)
    .where(eq(standardTopics.standardId, standard.id))
    .orderBy(standardTopics.sortOrder)
  
  // 获取标准指标
  const metrics = await db
    .select()
    .from(standardMetrics)
    .where(eq(standardMetrics.standardId, standard.id))
    .orderBy(standardMetrics.sortOrder)
  
  // 获取披露要求
  const disclosures = await db
    .select()
    .from(disclosureRequirements)
    .where(eq(disclosureRequirements.standardId, standard.id))
    .orderBy(disclosureRequirements.sortOrder)
  
  // 构建主题树
  const topicTree = buildTopicTree(topics)
  
  // 将指标关联到主题
  const metricsWithTopic = metrics.map(m => ({
    ...m,
    references: m.references ? JSON.parse(m.references) : null,
    crossReferences: m.crossReferences ? JSON.parse(m.crossReferences) : null,
    topicCode: topics.find(t => t.id === m.topicId)?.code || null
  }))
  
  return {
    ...standard,
    applicableRegions: JSON.parse(standard.applicableRegions || '[]'),
    config: standard.config ? JSON.parse(standard.config) : null,
    topics: topicTree,
    metrics: metricsWithTopic,
    disclosures: disclosures.map(d => ({
      ...d,
      applicabilityConditions: d.applicabilityConditions ? JSON.parse(d.applicabilityConditions) : null,
      applicableIndustries: d.applicableIndustries ? JSON.parse(d.applicableIndustries) : null,
      deadlineRule: d.deadlineRule ? JSON.parse(d.deadlineRule) : null,
      relatedMetricIds: d.relatedMetricIds ? JSON.parse(d.relatedMetricIds) : null
    })),
    statistics: {
      totalTopics: topics.length,
      totalMetrics: metrics.length,
      mandatoryMetrics: metrics.filter(m => m.disclosureLevel === 'mandatory').length,
      voluntaryMetrics: metrics.filter(m => m.disclosureLevel === 'voluntary').length,
      totalDisclosures: disclosures.length
    }
  }
})

/**
 * 构建主题树结构
 */
function buildTopicTree(topics: any[]) {
  const topicMap = new Map()
  const rootTopics: any[] = []
  
  // 先创建所有节点
  topics.forEach(topic => {
    topicMap.set(topic.id, { ...topic, children: [] })
  })
  
  // 构建树
  topics.forEach(topic => {
    const node = topicMap.get(topic.id)
    if (topic.parentId && topicMap.has(topic.parentId)) {
      topicMap.get(topic.parentId).children.push(node)
    } else {
      rootTopics.push(node)
    }
  })
  
  return rootTopics
}
