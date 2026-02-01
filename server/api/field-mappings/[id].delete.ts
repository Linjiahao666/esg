import { db } from '../../database'
import { fieldMappingTemplates } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少模板ID'
    })
  }

  await db.delete(fieldMappingTemplates).where(eq(fieldMappingTemplates.id, Number(id)))

  return { success: true, message: '映射模板已删除' }
})
