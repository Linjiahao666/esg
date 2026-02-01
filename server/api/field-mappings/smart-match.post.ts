import { autoMatchFields, dataSourceFields } from '../../utils/field-matcher'
import { db } from '../../database'
import { fieldMappingTemplates } from '../../database/schema'
import { eq, and } from 'drizzle-orm'

/**
 * 智能字段匹配 API
 * 
 * 根据源文件的字段列表和目标数据源，自动推荐字段映射
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sourceFields, dataSource, sourceSystem } = body

  if (!sourceFields || !Array.isArray(sourceFields)) {
    throw createError({
      statusCode: 400,
      message: '需要提供 sourceFields 字段列表'
    })
  }

  if (!dataSource) {
    throw createError({
      statusCode: 400,
      message: '需要指定 dataSource 数据源类型'
    })
  }

  // 获取目标字段定义
  const config = dataSourceFields[dataSource]
  if (!config) {
    throw createError({
      statusCode: 400,
      message: `不支持的数据源类型: ${dataSource}`
    })
  }

  // 检查是否有已保存的映射模板
  let savedTemplate = null
  if (sourceSystem) {
    const templates = await db.select().from(fieldMappingTemplates)
      .where(and(
        eq(fieldMappingTemplates.dataSource, dataSource),
        eq(fieldMappingTemplates.sourceSystem, sourceSystem)
      ))
      .limit(1)

    if (templates.length > 0) {
      savedTemplate = {
        ...templates[0],
        mappings: JSON.parse(templates[0].mappings || '{}'),
        valueTransforms: JSON.parse(templates[0].valueTransforms || '{}'),
        fieldAliases: JSON.parse(templates[0].fieldAliases || '{}')
      }
    }
  }

  // 如果没有匹配的模板，检查默认模板
  if (!savedTemplate) {
    const defaultTemplates = await db.select().from(fieldMappingTemplates)
      .where(and(
        eq(fieldMappingTemplates.dataSource, dataSource),
        eq(fieldMappingTemplates.isDefault, true)
      ))
      .limit(1)

    if (defaultTemplates.length > 0) {
      savedTemplate = {
        ...defaultTemplates[0],
        mappings: JSON.parse(defaultTemplates[0].mappings || '{}'),
        valueTransforms: JSON.parse(defaultTemplates[0].valueTransforms || '{}'),
        fieldAliases: JSON.parse(defaultTemplates[0].fieldAliases || '{}')
      }
    }
  }

  // 使用智能匹配
  const autoMatched = autoMatchFields(sourceFields, dataSource)

  // 合并已保存的映射（优先级最高）和智能匹配结果
  const suggestedMapping: Record<string, string> = {}
  const matchDetails: Record<string, { confidence: number; method: string; fromTemplate?: boolean }> = {}

  for (const sourceField of sourceFields) {
    // 1. 优先使用已保存模板的映射
    if (savedTemplate?.mappings[sourceField]) {
      suggestedMapping[sourceField] = savedTemplate.mappings[sourceField]
      matchDetails[sourceField] = {
        confidence: 1.0,
        method: 'template',
        fromTemplate: true
      }
    }
    // 2. 检查别名（来自模板）
    else if (savedTemplate?.fieldAliases) {
      for (const [targetField, aliases] of Object.entries(savedTemplate.fieldAliases)) {
        if ((aliases as string[]).includes(sourceField)) {
          suggestedMapping[sourceField] = targetField
          matchDetails[sourceField] = {
            confidence: 0.95,
            method: 'template_alias',
            fromTemplate: true
          }
          break
        }
      }
    }
    // 3. 使用智能匹配结果
    if (!suggestedMapping[sourceField] && autoMatched[sourceField]) {
      suggestedMapping[sourceField] = autoMatched[sourceField].targetField
      matchDetails[sourceField] = {
        confidence: autoMatched[sourceField].confidence,
        method: autoMatched[sourceField].method,
        fromTemplate: false
      }
    }
  }

  return {
    // 目标字段定义
    targetFields: config.fields,
    // 建议的映射关系
    suggestedMapping,
    // 匹配详情（用于显示置信度）
    matchDetails,
    // 值转换规则
    valueTransforms: savedTemplate?.valueTransforms || config.valueTransforms || {},
    // 使用的模板信息
    template: savedTemplate ? {
      id: savedTemplate.id,
      name: savedTemplate.name,
      sourceSystem: savedTemplate.sourceSystem
    } : null,
    // 未匹配的源字段
    unmatchedFields: sourceFields.filter(f => !suggestedMapping[f]),
    // 必填但未匹配的目标字段
    missingRequiredFields: config.fields
      .filter(f => f.required && !Object.values(suggestedMapping).includes(f.key))
      .map(f => ({ key: f.key, label: f.label }))
  }
})
