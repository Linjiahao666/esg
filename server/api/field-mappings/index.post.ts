import { db } from '../../database'
import { fieldMappingTemplates } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { id, name, dataSource, sourceSystem, description, mappings, valueTransforms, fieldAliases, isDefault } = body

  if (!name || !dataSource || !mappings) {
    throw createError({
      statusCode: 400,
      message: '缺少必要字段：name, dataSource, mappings'
    })
  }

  const now = new Date().toISOString()

  // 如果设置为默认，先取消其他默认
  if (isDefault) {
    await db.update(fieldMappingTemplates)
      .set({ isDefault: false })
      .where(eq(fieldMappingTemplates.dataSource, dataSource))
  }

  const templateData = {
    name,
    dataSource,
    sourceSystem: sourceSystem || null,
    description: description || null,
    mappings: JSON.stringify(mappings),
    valueTransforms: JSON.stringify(valueTransforms || {}),
    fieldAliases: JSON.stringify(fieldAliases || {}),
    isDefault: isDefault || false,
    updatedAt: now
  }

  if (id) {
    // 更新
    await db.update(fieldMappingTemplates)
      .set(templateData)
      .where(eq(fieldMappingTemplates.id, id))

    return { success: true, id, message: '映射模板已更新' }
  } else {
    // 新增
    const result = await db.insert(fieldMappingTemplates).values({
      ...templateData,
      usageCount: 0,
      createdAt: now
    }).returning({ id: fieldMappingTemplates.id })

    return { success: true, id: result[0].id, message: '映射模板已创建' }
  }
})
