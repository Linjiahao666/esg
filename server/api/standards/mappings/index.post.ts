import { eq } from 'drizzle-orm'
import { db, metricMappings, users } from '../../../database'

/**
 * 创建指标映射
 * POST /api/standards/mappings
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // 验证必填字段
  const { localMetricId, standardMetricId, mappingType } = body
  
  if (!localMetricId || !standardMetricId) {
    throw createError({
      statusCode: 400,
      message: '本地指标ID和标准指标ID不能为空'
    })
  }
  
  // 检查是否已存在映射
  const existing = await db
    .select()
    .from(metricMappings)
    .where(
      eq(metricMappings.localMetricId, localMetricId)
    )
  
  const existingForStandard = existing.find(m => m.standardMetricId === standardMetricId)
  if (existingForStandard) {
    throw createError({
      statusCode: 400,
      message: '该映射关系已存在'
    })
  }
  
  // 获取当前用户
  const session = event.context.session
  const userId = session?.userId
  
  // 创建映射
  const [mapping] = await db
    .insert(metricMappings)
    .values({
      localMetricId,
      standardMetricId,
      mappingType: mappingType || 'exact',
      confidence: body.confidence || 100,
      transformationNotes: body.transformationNotes,
      transformationFormula: body.transformationFormula 
        ? JSON.stringify(body.transformationFormula) 
        : null,
      unitConversionFactor: body.unitConversionFactor,
      dataDifferenceNotes: body.dataDifferenceNotes,
      requiresAdditionalData: body.requiresAdditionalData || false,
      additionalDataNotes: body.additionalDataNotes,
      isAutoMapped: body.isAutoMapped || false,
      isVerified: false,
      enabled: true,
      createdBy: userId
    })
    .returning()
  
  return {
    success: true,
    data: mapping
  }
})
