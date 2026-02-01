/**
 * 获取数据源统计信息
 * 
 * 返回各数据源表的记录数量和最后更新时间
 * 支持 24 个完整数据源
 */

import { db, employees, energyConsumption, carbonEmissions, wasteData, suppliers, trainingRecords, safetyIncidents, donations, environmentalCompliance, waterConsumption, wasteWaterRecords, airEmissionRecords, materialConsumption, noiseRecords, employeeWorkTime, salaryRecords, boardMembers, supervisors, executives, shareholders, rdInvestment, patents, productIncidents, environmentInvestments, companyFinancials, meetingRecords, certifications } from '../../database'
import { count, max, sql } from 'drizzle-orm'
import { dataSourceMeta } from '../../utils/field-matcher'

interface DataSourceInfo {
  key: string
  name: string
  nameEn: string
  description: string
  category: 'E' | 'S' | 'G' | 'common'
  relatedMetrics: string[]
  icon: string
  recordCount: number
  lastUpdated?: string
}

// 数据源表映射
const tableMap: Record<string, any> = {
  employees,
  energy_consumption: energyConsumption,
  carbon_emissions: carbonEmissions,
  waste_data: wasteData,
  suppliers,
  training_records: trainingRecords,
  safety_incidents: safetyIncidents,
  donations,
  environmental_compliance: environmentalCompliance,
  water_consumption: waterConsumption,
  waste_water_records: wasteWaterRecords,
  air_emission_records: airEmissionRecords,
  material_consumption: materialConsumption,
  noise_records: noiseRecords,
  employee_work_time: employeeWorkTime,
  salary_records: salaryRecords,
  board_members: boardMembers,
  supervisors,
  executives,
  shareholders,
  rd_investment: rdInvestment,
  patents,
  product_incidents: productIncidents,
  environment_investments: environmentInvestments,
  company_financials: companyFinancials,
  meeting_records: meetingRecords,
  certifications
}

// 图标映射
const iconMap: Record<string, string> = {
  employees: 'i-heroicons-users',
  energy_consumption: 'i-heroicons-bolt',
  carbon_emissions: 'i-heroicons-cloud',
  waste_data: 'i-heroicons-trash',
  suppliers: 'i-heroicons-truck',
  training_records: 'i-heroicons-academic-cap',
  safety_incidents: 'i-heroicons-shield-exclamation',
  donations: 'i-heroicons-heart',
  environmental_compliance: 'i-heroicons-document-check',
  water_consumption: 'i-heroicons-beaker',
  waste_water_records: 'i-heroicons-funnel',
  air_emission_records: 'i-heroicons-cloud-arrow-up',
  material_consumption: 'i-heroicons-cube',
  noise_records: 'i-heroicons-speaker-wave',
  employee_work_time: 'i-heroicons-clock',
  salary_records: 'i-heroicons-currency-yen',
  board_members: 'i-heroicons-user-group',
  supervisors: 'i-heroicons-eye',
  executives: 'i-heroicons-briefcase',
  shareholders: 'i-heroicons-chart-pie',
  rd_investment: 'i-heroicons-light-bulb',
  patents: 'i-heroicons-document-text',
  product_incidents: 'i-heroicons-exclamation-triangle',
  environment_investments: 'i-heroicons-banknotes',
  company_financials: 'i-heroicons-calculator',
  meeting_records: 'i-heroicons-calendar',
  certifications: 'i-heroicons-check-badge'
}

export default defineEventHandler(async (event) => {
  try {
    const dataSources: DataSourceInfo[] = []

    // 遍历所有数据源获取统计信息
    for (const [key, table] of Object.entries(tableMap)) {
      try {
        // 获取记录数
        const countResult = await db.select({ count: count() }).from(table)
        const recordCount = countResult[0]?.count || 0

        // 尝试获取最后更新时间（不是所有表都有 updatedAt 或 createdAt 字段）
        let lastUpdated: string | undefined
        try {
          if (table.updatedAt) {
            const updatedResult = await db.select({ lastUpdated: max(table.updatedAt) }).from(table)
            lastUpdated = updatedResult[0]?.lastUpdated
          } else if (table.createdAt) {
            const createdResult = await db.select({ lastUpdated: max(table.createdAt) }).from(table)
            lastUpdated = createdResult[0]?.lastUpdated
          }
        } catch {
          // 忽略时间戳获取错误
        }

        // 获取元数据
        const meta = dataSourceMeta[key] || {
          name: key,
          nameEn: key,
          description: '',
          category: 'common' as const,
          relatedMetrics: []
        }

        dataSources.push({
          key,
          name: meta.name,
          nameEn: meta.nameEn,
          description: meta.description,
          category: meta.category,
          relatedMetrics: meta.relatedMetrics,
          icon: iconMap[key] || 'i-heroicons-document',
          recordCount,
          lastUpdated
        })
      } catch (e) {
        console.warn(`获取 ${key} 统计失败:`, e)
        // 仍然添加数据源信息，只是没有统计数据
        const meta = dataSourceMeta[key] || {
          name: key,
          nameEn: key,
          description: '',
          category: 'common' as const,
          relatedMetrics: []
        }
        dataSources.push({
          key,
          name: meta.name,
          nameEn: meta.nameEn,
          description: meta.description,
          category: meta.category,
          relatedMetrics: meta.relatedMetrics,
          icon: iconMap[key] || 'i-heroicons-document',
          recordCount: 0
        })
      }
    }

    // 按类别分组
    const byCategory = {
      E: dataSources.filter(ds => ds.category === 'E'),
      S: dataSources.filter(ds => ds.category === 'S'),
      G: dataSources.filter(ds => ds.category === 'G'),
      common: dataSources.filter(ds => ds.category === 'common')
    }

    // 计算总记录数
    const totalRecords = dataSources.reduce((sum, ds) => sum + ds.recordCount, 0)

    // 计算各类别记录数
    const categoryStats = {
      E: byCategory.E.reduce((sum, ds) => sum + ds.recordCount, 0),
      S: byCategory.S.reduce((sum, ds) => sum + ds.recordCount, 0),
      G: byCategory.G.reduce((sum, ds) => sum + ds.recordCount, 0),
      common: byCategory.common.reduce((sum, ds) => sum + ds.recordCount, 0)
    }

    return {
      success: true,
      totalRecords,
      totalDataSources: dataSources.length,
      categoryStats,
      dataSources,
      byCategory
    }
  } catch (e: any) {
    console.error('获取数据源统计失败:', e)
    return { success: false, message: e.message || '获取数据源统计失败' }
  }
})
