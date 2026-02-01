import { db } from '../../database'
import { fieldMappingTemplates } from '../../database/schema'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dataSource = query.dataSource as string | undefined

  let queryBuilder = db.select().from(fieldMappingTemplates)

  if (dataSource) {
    queryBuilder = queryBuilder.where(eq(fieldMappingTemplates.dataSource, dataSource)) as any
  }

  const templates = await queryBuilder.orderBy(desc(fieldMappingTemplates.usageCount))

  return templates.map(t => ({
    ...t,
    mappings: JSON.parse(t.mappings || '{}'),
    valueTransforms: JSON.parse(t.valueTransforms || '{}'),
    fieldAliases: JSON.parse(t.fieldAliases || '{}')
  }))
})
