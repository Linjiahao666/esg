import { eq, and } from 'drizzle-orm'
import { db, companyStandardConfigs, esgStandards } from '../../../database'

/**
 * 获取企业采用的标准配置
 * GET /api/standards/company-configs
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  const orgUnitId = query.orgUnitId ? Number(query.orgUnitId) : undefined
  
  // 获取企业配置及关联的标准信息
  let conditions = []
  if (orgUnitId) {
    conditions.push(eq(companyStandardConfigs.orgUnitId, orgUnitId))
  }
  
  const configs = await db
    .select({
      config: companyStandardConfigs,
      standard: esgStandards
    })
    .from(companyStandardConfigs)
    .innerJoin(esgStandards, eq(companyStandardConfigs.standardId, esgStandards.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(companyStandardConfigs.isPrimary)
  
  return configs.map(c => ({
    id: c.config.id,
    adoptionStatus: c.config.adoptionStatus,
    firstAdoptionYear: c.config.firstAdoptionYear,
    targetComplianceYear: c.config.targetComplianceYear,
    complianceRate: c.config.complianceRate,
    isPrimary: c.config.isPrimary,
    enabled: c.config.enabled,
    notes: c.config.notes,
    config: c.config.config ? JSON.parse(c.config.config) : null,
    standard: {
      id: c.standard.id,
      code: c.standard.code,
      name: c.standard.name,
      issuer: c.standard.issuer,
      applicableRegions: JSON.parse(c.standard.applicableRegions || '[]'),
      standardType: c.standard.standardType,
      version: c.standard.version,
      status: c.standard.status
    }
  }))
})
