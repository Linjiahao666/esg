import { eq } from 'drizzle-orm'
import { db, companyStandardConfigs, esgStandards } from '../../../database'

/**
 * 创建/更新企业标准配置
 * POST /api/standards/company-configs
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const session = event.context.session
  
  const { standardCode, orgUnitId, adoptionStatus, firstAdoptionYear, targetComplianceYear, isPrimary, notes, config } = body
  
  if (!standardCode) {
    throw createError({
      statusCode: 400,
      message: '标准代码不能为空'
    })
  }
  
  // 获取标准
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
  
  // 检查是否已存在配置
  const [existing] = await db
    .select()
    .from(companyStandardConfigs)
    .where(eq(companyStandardConfigs.standardId, standard.id))
    .limit(1)
  
  if (existing) {
    // 更新现有配置
    const [updated] = await db
      .update(companyStandardConfigs)
      .set({
        adoptionStatus: adoptionStatus || existing.adoptionStatus,
        firstAdoptionYear: firstAdoptionYear ?? existing.firstAdoptionYear,
        targetComplianceYear: targetComplianceYear ?? existing.targetComplianceYear,
        isPrimary: isPrimary ?? existing.isPrimary,
        notes: notes ?? existing.notes,
        config: config ? JSON.stringify(config) : existing.config,
        updatedAt: new Date()
      })
      .where(eq(companyStandardConfigs.id, existing.id))
      .returning()
    
    return {
      success: true,
      action: 'updated',
      data: updated
    }
  } else {
    // 创建新配置
    const [created] = await db
      .insert(companyStandardConfigs)
      .values({
        standardId: standard.id,
        orgUnitId: orgUnitId || null,
        adoptionStatus: adoptionStatus || 'planning',
        firstAdoptionYear,
        targetComplianceYear,
        isPrimary: isPrimary || false,
        responsibleUserId: session?.userId || null,
        notes,
        config: config ? JSON.stringify(config) : null,
        enabled: true
      })
      .returning()
    
    return {
      success: true,
      action: 'created',
      data: created
    }
  }
})
