/**
 * 获取报告模板列表
 * GET /api/reports/templates
 */

import { eq } from 'drizzle-orm'
import { db, reportTemplates } from '../../database'

export default defineEventHandler(async (event) => {
  // 验证用户身份
  const user = await requireAuth(event)

  // 获取启用的模板
  const templates = await db.query.reportTemplates.findMany({
    where: eq(reportTemplates.enabled, true),
    orderBy: (t, { desc }) => [desc(t.isDefault), t.name]
  })

  return {
    items: templates.map(t => ({
      id: t.id,
      code: t.code,
      name: t.name,
      description: t.description,
      type: t.type,
      standards: JSON.parse(t.standards || '[]'),
      isDefault: t.isDefault,
      version: t.version
    })),
    total: templates.length
  }
})