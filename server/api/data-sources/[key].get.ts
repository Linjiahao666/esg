/**
 * 获取指定数据源的数据列表
 */

import { db, employees, energyConsumption, carbonEmissions, wasteData, suppliers, trainingRecords, safetyIncidents, donations, environmentalCompliance } from '../../database'
import { count, desc } from 'drizzle-orm'

// 数据表映射
const tableMap: Record<string, any> = {
  employees,
  energy_consumption: energyConsumption,
  carbon_emissions: carbonEmissions,
  waste_data: wasteData,
  suppliers,
  training_records: trainingRecords,
  safety_incidents: safetyIncidents,
  donations,
  environmental_compliance: environmentalCompliance
}

// 排序字段映射
const orderByMap: Record<string, any> = {
  employees: employees.id,
  energy_consumption: energyConsumption.id,
  carbon_emissions: carbonEmissions.id,
  waste_data: wasteData.id,
  suppliers: suppliers.id,
  training_records: trainingRecords.id,
  safety_incidents: safetyIncidents.id,
  donations: donations.id,
  environmental_compliance: environmentalCompliance.id
}

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, 'key')
    const query = getQuery(event)

    const page = parseInt(query.page as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 20
    const offset = (page - 1) * pageSize

    if (!key || !tableMap[key]) {
      return { success: false, message: '不支持的数据源' }
    }

    const table = tableMap[key]
    const orderBy = orderByMap[key]

    // 获取总数
    const countResult = await db.select({ count: count() }).from(table)
    const total = countResult[0]?.count || 0

    // 获取数据
    const data = await db.select()
      .from(table)
      .orderBy(desc(orderBy))
      .limit(pageSize)
      .offset(offset)

    return {
      success: true,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  } catch (e: any) {
    console.error('获取数据源数据失败:', e)
    return { success: false, message: e.message || '获取数据失败' }
  }
})
