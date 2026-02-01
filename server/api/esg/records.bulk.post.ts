import { db, employees, energyConsumption, suppliers, trainingRecords, safetyIncidents, donations, wasteData, carbonEmissions, environmentalCompliance, waterConsumption, wasteWaterRecords, airEmissionRecords, materialConsumption, noiseRecords, employeeWorkTime, salaryRecords, boardMembers, supervisors, executives, shareholders, rdInvestment, patents, productIncidents, environmentInvestments, companyFinancials, meetingRecords, certifications } from '../../database'
import { fieldMappingTemplates } from '../../database/schema'
import { parse as parseCSV } from 'csv-parse/sync'
import { eq, sql } from 'drizzle-orm'
import { applyFieldMapping, autoMatchFields, dataSourceFields } from '../../utils/field-matcher'
import { requireEntry } from '../../utils/auth'

// 默认字段映射配置（作为备用）
const defaultFieldMappings: Record<string, Record<string, string>> = {
  employees: {
    '工号': 'employeeNo',
    '姓名': 'name',
    '性别': 'gender',
    '出生日期': 'birthDate',
    '部门': 'department',
    '职位': 'position',
    '职级': 'level',
    '员工类型': 'employeeType',
    '是否党员': 'isPartyMember',
    '是否工会成员': 'isUnionMember',
    '是否残疾人': 'isDisabled',
    '是否少数民族': 'isMinority',
    '学历': 'education',
    '入职日期': 'hireDate',
    '离职日期': 'leaveDate',
    '状态': 'status'
  },
  energy_consumption: {
    '周期': 'period',
    '能源类型': 'energyType',
    '消耗量': 'consumption',
    '单位': 'unit',
    '费用': 'cost',
    '设施': 'facility',
    '来源': 'source',
    '是否可再生': 'isRenewable'
  },
  suppliers: {
    '编号': 'code',
    '名称': 'name',
    '类别': 'category',
    '地区': 'region',
    '是否本地': 'isLocal',
    '合同金额': 'contractAmount',
    'ESG评级': 'esgRating',
    '状态': 'status'
  },
  training_records: {
    '员工工号': 'employeeNo',
    '培训类型': 'trainingType',
    '培训名称': 'trainingName',
    '培训日期': 'trainingDate',
    '时长(小时)': 'duration',
    '费用': 'cost',
    '培训机构': 'provider',
    '是否在线': 'isOnline',
    '是否通过': 'isPassed'
  },
  safety_incidents: {
    '事故编号': 'incidentNo',
    '事故日期': 'incidentDate',
    '事故类型': 'incidentType',
    '严重程度': 'severity',
    '地点': 'location',
    '描述': 'description',
    '受伤人数': 'injuredCount',
    '死亡人数': 'fatalCount',
    '损失工时': 'lostDays',
    '直接损失': 'directCost',
    '状态': 'status'
  },
  donations: {
    '捐赠日期': 'donationDate',
    '捐赠类型': 'donationType',
    '类别': 'category',
    '受捐方': 'recipient',
    '金额': 'amount',
    '志愿服务时长': 'volunteerHours',
    '志愿者人数': 'volunteerCount',
    '描述': 'description'
  },
  waste_data: {
    '周期': 'period',
    '废物类型': 'wasteType',
    '废物名称': 'wasteName',
    '数量': 'quantity',
    '单位': 'unit',
    '处置方式': 'disposalMethod',
    '处置单位': 'disposalVendor',
    '是否合规': 'isCompliant'
  },
  carbon_emissions: {
    '周期': 'period',
    '范围': 'scope',
    '类别': 'category',
    '排放源': 'source',
    '活动数据': 'activityData',
    '活动单位': 'activityUnit',
    '排放因子': 'emissionFactor',
    '排放量(tCO2e)': 'emission'
  },
  // === 新增数据源映射 ===
  water_consumption: {
    '周期': 'period',
    '水源类型': 'waterSource',
    '用水量': 'consumption',
    '单位': 'unit',
    '费用': 'cost',
    '回收水量': 'recycledAmount',
    '设施': 'facility'
  },
  waste_water_records: {
    '周期': 'period',
    '排放点': 'dischargePoint',
    '排放量': 'dischargeAmount',
    '单位': 'unit',
    'COD浓度': 'codConcentration',
    'COD排放量': 'codAmount',
    '氨氮浓度': 'ammoniaConcentration',
    '氨氮排放量': 'ammoniaAmount',
    '是否达标': 'isCompliant'
  },
  air_emission_records: {
    '周期': 'period',
    '排放点': 'emissionPoint',
    '污染物类型': 'pollutantType',
    '排放量': 'emissionAmount',
    '单位': 'unit',
    '排放浓度': 'concentration',
    '是否达标': 'isCompliant',
    '处理设施': 'treatmentFacility'
  },
  material_consumption: {
    '周期': 'period',
    '物料名称': 'materialName',
    '物料类型': 'materialType',
    '消耗量': 'consumption',
    '单位': 'unit',
    '费用': 'cost',
    '是否可再生': 'isRecycled',
    '供应商': 'supplier'
  },
  noise_records: {
    '周期': 'period',
    '监测点位': 'monitoringPoint',
    '噪声值': 'noiseLevel',
    '单位': 'unit',
    '标准限值': 'standardLimit',
    '是否超标': 'isExceedStandard',
    '监测时间': 'measurementTime'
  },
  employee_work_time: {
    '周期': 'period',
    '员工工号': 'employeeNo',
    '正常工时': 'regularHours',
    '加班工时': 'overtimeHours',
    '出勤天数': 'attendanceDays',
    '请假天数': 'leaveDays'
  },
  salary_records: {
    '周期': 'period',
    '员工工号': 'employeeNo',
    '基本工资': 'baseSalary',
    '绩效奖金': 'bonus',
    '补贴': 'allowance',
    '社保公积金': 'socialInsurance',
    '实发工资': 'netSalary'
  },
  board_members: {
    '姓名': 'name',
    '性别': 'gender',
    '年龄': 'age',
    '职务': 'position',
    '是否独立董事': 'isIndependent',
    '任期开始': 'termStart',
    '任期结束': 'termEnd',
    '持股数量': 'shareholding',
    '薪酬': 'compensation',
    '状态': 'status'
  },
  supervisors: {
    '姓名': 'name',
    '性别': 'gender',
    '年龄': 'age',
    '职务': 'position',
    '是否职工代表': 'isEmployeeRepresentative',
    '任期开始': 'termStart',
    '任期结束': 'termEnd',
    '薪酬': 'compensation',
    '状态': 'status'
  },
  executives: {
    '姓名': 'name',
    '性别': 'gender',
    '年龄': 'age',
    '职务': 'position',
    '分管领域': 'responsibility',
    '任职日期': 'appointmentDate',
    '年薪': 'annualSalary',
    '持股数量': 'shareholding',
    '状态': 'status'
  },
  shareholders: {
    '股东名称': 'shareholderName',
    '股东类型': 'shareholderType',
    '持股数量': 'shareholdingAmount',
    '持股比例': 'shareholdingRatio',
    '是否关联方': 'isRelatedParty',
    '联系人': 'contactPerson',
    '联系电话': 'contactPhone'
  },
  rd_investment: {
    '周期': 'period',
    '项目名称': 'projectName',
    '投资类型': 'investmentType',
    '投资金额': 'amount',
    '研发人员数': 'personnelCount',
    '研发阶段': 'stage',
    '预期成果': 'expectedOutcome'
  },
  patents: {
    '专利号': 'patentNo',
    '专利名称': 'patentName',
    '专利类型': 'patentType',
    '申请日期': 'applicationDate',
    '授权日期': 'grantDate',
    '状态': 'status',
    '发明人': 'inventors',
    '有效期': 'validUntil'
  },
  product_incidents: {
    '事件编号': 'incidentNo',
    '事件日期': 'incidentDate',
    '事件类型': 'incidentType',
    '产品名称': 'productName',
    '事件描述': 'description',
    '影响范围': 'affectedScope',
    '处理措施': 'resolution',
    '处理状态': 'status'
  },
  environment_investments: {
    '周期': 'period',
    '投资类型': 'investmentType',
    '项目名称': 'projectName',
    '投资金额': 'amount',
    '预期效益': 'expectedBenefit',
    '完成状态': 'status'
  },
  company_financials: {
    '周期': 'period',
    '营业收入': 'revenue',
    '营业成本': 'operatingCost',
    '净利润': 'netProfit',
    '总资产': 'totalAssets',
    '员工人数': 'employeeCount',
    '产值': 'outputValue'
  },
  meeting_records: {
    '会议日期': 'meetingDate',
    '会议类型': 'meetingType',
    '会议届次': 'meetingSession',
    '出席人数': 'attendeeCount',
    '应出席人数': 'expectedAttendees',
    '议案数量': 'proposalCount',
    '主要议题': 'mainTopics'
  },
  certifications: {
    '认证名称': 'certificationName',
    '认证类型': 'certificationType',
    '认证机构': 'certificationBody',
    '认证范围': 'scope',
    '发证日期': 'issueDate',
    '有效期至': 'validUntil',
    '证书编号': 'certificateNo',
    '状态': 'status'
  }
}

// 批量导入 ESG 数据
// 权限要求：录入者(entry) 或 管理员(admin)
export default defineEventHandler(async (event) => {
  try {
    // 验证权限
    await requireEntry(event)

    const formData = await readMultipartFormData(event)
    if (!formData) {
      return { success: false, message: '未上传文件' }
    }

    const fileField = formData.find(f => f.name === 'file')
    const dataSourceField = formData.find(f => f.name === 'dataSource')
    const actionField = formData.find(f => f.name === 'action') // preview, analyze, 或 import
    const customMappingField = formData.find(f => f.name === 'customMapping') // 自定义字段映射 JSON
    const templateIdField = formData.find(f => f.name === 'templateId') // 使用的映射模板 ID
    const saveTemplateField = formData.find(f => f.name === 'saveTemplate') // 是否保存为模板
    const templateNameField = formData.find(f => f.name === 'templateName') // 模板名称
    const sourceSystemField = formData.find(f => f.name === 'sourceSystem') // 来源系统

    if (!fileField || !fileField.data) {
      return { success: false, message: '未找到文件' }
    }

    const dataSource = dataSourceField?.data.toString() || 'employees'
    const action = actionField?.data.toString() || 'preview'
    const content = fileField.data.toString('utf-8')
    const templateId = templateIdField?.data.toString()
    const saveTemplate = saveTemplateField?.data.toString() === 'true'
    const templateName = templateNameField?.data.toString()
    const sourceSystem = sourceSystemField?.data.toString()

    // 解析CSV
    const records = parseCSV(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true
    })

    if (records.length === 0) {
      return { success: false, message: '文件为空' }
    }

    const sourceColumns = Object.keys(records[0] || {})

    // 分析模式 - 只返回源字段和智能匹配建议
    if (action === 'analyze') {
      const autoMatched = autoMatchFields(sourceColumns, dataSource)
      const config = dataSourceFields[dataSource]

      return {
        success: true,
        sourceColumns,
        targetFields: config?.fields || [],
        suggestedMapping: Object.fromEntries(
          Object.entries(autoMatched).map(([k, v]) => [k, v.targetField])
        ),
        matchDetails: autoMatched,
        totalCount: records.length,
        sampleData: records.slice(0, 5)
      }
    }

    // 确定使用的字段映射
    let mapping: Record<string, string> = {}
    let valueTransforms: Record<string, Record<string, any>> = {}
    let usedTemplateId: number | null = null

    // 1. 优先使用自定义映射
    if (customMappingField) {
      try {
        const customData = JSON.parse(customMappingField.data.toString())
        mapping = customData.mapping || customData
        valueTransforms = customData.valueTransforms || {}
      } catch (e) {
        console.warn('解析自定义映射失败，使用默认映射')
      }
    }

    // 2. 如果指定了模板ID，使用模板
    if (!Object.keys(mapping).length && templateId) {
      const templates = await db.select().from(fieldMappingTemplates)
        .where(eq(fieldMappingTemplates.id, Number(templateId)))
        .limit(1)

      if (templates.length > 0) {
        mapping = JSON.parse(templates[0].mappings || '{}')
        valueTransforms = JSON.parse(templates[0].valueTransforms || '{}')
        usedTemplateId = templates[0].id
      }
    }

    // 3. 尝试智能匹配
    if (!Object.keys(mapping).length) {
      const autoMatched = autoMatchFields(sourceColumns, dataSource)
      mapping = Object.fromEntries(
        Object.entries(autoMatched)
          .filter(([, v]) => v.confidence >= 0.6)
          .map(([k, v]) => [k, v.targetField])
      )
    }

    // 4. 回退到默认映射
    if (!Object.keys(mapping).length) {
      mapping = defaultFieldMappings[dataSource] || {}
    }

    // 合并值转换规则
    const config = dataSourceFields[dataSource]
    const mergedTransforms = { ...config?.valueTransforms, ...valueTransforms }

    // 转换数据
    const transformedRecords = records.map((row: any, index: number) => {
      const transformed = applyFieldMapping(row, mapping, dataSource, valueTransforms)
      transformed._rowIndex = index + 2 // 行号（从2开始，1是表头）
      return transformed
    })

    // 如果是预览模式
    if (action === 'preview') {
      return {
        success: true,
        preview: transformedRecords.slice(0, 20),
        totalCount: transformedRecords.length,
        sourceColumns,
        usedMapping: mapping,
        mappedColumns: [...new Set(Object.values(mapping))]
      }
    }

    // 导入模式 - 写入数据库
    const tableMap: Record<string, any> = {
      // 原有数据源
      employees,
      energy_consumption: energyConsumption,
      suppliers,
      training_records: trainingRecords,
      safety_incidents: safetyIncidents,
      donations,
      waste_data: wasteData,
      carbon_emissions: carbonEmissions,
      environmental_compliance: environmentalCompliance,
      // 新增数据源
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

    const table = tableMap[dataSource]
    if (!table) {
      return { success: false, message: '不支持的数据源类型' }
    }

    // 批量插入
    let successCount = 0
    let errorCount = 0
    const errors: any[] = []

    for (const record of transformedRecords) {
      try {
        const { _rowIndex, ...data } = record
        await db.insert(table).values(data).onConflictDoNothing()
        successCount++
      } catch (e: any) {
        errorCount++
        errors.push({ row: record._rowIndex, error: e.message })
      }
    }

    // 如果需要保存为模板
    if (saveTemplate && templateName && Object.keys(mapping).length > 0) {
      const now = new Date().toISOString()
      await db.insert(fieldMappingTemplates).values({
        name: templateName,
        dataSource,
        sourceSystem: sourceSystem || null,
        description: `从导入自动创建`,
        mappings: JSON.stringify(mapping),
        valueTransforms: JSON.stringify(valueTransforms),
        fieldAliases: JSON.stringify({}),
        isDefault: false,
        usageCount: 1,
        createdAt: now,
        updatedAt: now
      })
    }

    // 更新模板使用次数
    if (usedTemplateId) {
      await db.update(fieldMappingTemplates)
        .set({
          usageCount: sql`${fieldMappingTemplates.usageCount} + 1`,
          updatedAt: new Date().toISOString()
        })
        .where(eq(fieldMappingTemplates.id, usedTemplateId))
    }

    return {
      success: true,
      message: `导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // 只返回前10个错误
    }
  } catch (e: any) {
    console.error('批量导入失败:', e)
    return { success: false, message: e.message || '导入失败' }
  }
})
