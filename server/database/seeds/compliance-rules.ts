/**
 * ESG 合规规则种子数据
 *
 * 包含四类预置规则：
 * 1. 数据完整性检查 - 必填字段验证
 * 2. 数值合理性检查 - 范围、异常值检测
 * 3. 业务逻辑检查 - 跨指标一致性验证
 * 4. 法规合规检查 - 披露要求验证
 */

import { db, complianceRules } from '../index'
import type { NewComplianceRule } from '../schema'

// 预置规则定义
const PRESET_RULES: Omit<NewComplianceRule, 'createdAt' | 'updatedAt'>[] = [
  // ============ 1. 数据完整性检查规则 ============
  {
    code: 'CR001',
    name: '碳排放数据必填检查',
    description: '碳排放相关核心指标必须填写，这是ESG披露的基础要求',
    ruleType: 'required',
    targetMetrics: JSON.stringify(['E1.1.*', 'E1.2.*']),
    targetSubModules: JSON.stringify(['E1']),
    condition: JSON.stringify({
      type: 'required',
      field: 'value',
    }),
    severity: 'error',
    regulation: '上交所ESG披露指引',
    message: '指标 {metricCode} 为碳排放核心数据，必须填写',
    suggestion: '请根据企业实际排放数据填写，如无数据请填写0并说明原因',
    triggerOn: 'submit',
    priority: 10,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR002',
    name: '员工数据必填检查',
    description: '员工总数等基础社会指标必须填写',
    ruleType: 'required',
    targetMetrics: JSON.stringify(['S1.1.1', 'S1.1.2']),
    targetSubModules: JSON.stringify(['S1']),
    condition: JSON.stringify({
      type: 'required',
      field: 'value',
    }),
    severity: 'error',
    regulation: 'GRI 2-7',
    message: '指标 {metricCode} 为员工基础数据，必须填写',
    suggestion: '请根据HR系统数据填写员工总数',
    triggerOn: 'submit',
    priority: 10,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR003',
    name: '治理结构必填检查',
    description: '董事会构成等治理核心数据必须填写',
    ruleType: 'required',
    targetMetrics: JSON.stringify(['G1.1.*', 'G1.2.*']),
    targetSubModules: JSON.stringify(['G1']),
    condition: JSON.stringify({
      type: 'required',
      field: 'value',
    }),
    severity: 'error',
    regulation: '公司法/上市公司治理准则',
    message: '指标 {metricCode} 为公司治理核心数据，必须填写',
    suggestion: '请根据公司章程和股东大会决议填写',
    triggerOn: 'submit',
    priority: 10,
    enabled: true,
    applicablePeriods: 'yearly',
  },

  // ============ 2. 数值合理性检查规则 ============
  {
    code: 'CR010',
    name: '百分比数值范围检查',
    description: '所有百分比类型的指标值应在0-100之间',
    ruleType: 'range',
    targetMetrics: JSON.stringify(['*.ratio', '*.rate', '*.percentage']),
    targetSubModules: JSON.stringify(['*']),
    condition: JSON.stringify({
      type: 'range',
      field: 'valueNumber',
      operator: 'between',
      params: [0, 100],
    }),
    severity: 'error',
    message: '指标 {metricCode} 的值 {value} 超出百分比范围(0-100)',
    suggestion: '请检查数据是否正确，百分比值应在0-100之间',
    triggerOn: 'realtime',
    priority: 20,
    enabled: true,
    applicablePeriods: 'all',
  },
  {
    code: 'CR011',
    name: '碳排放量非负检查',
    description: '碳排放量不能为负数',
    ruleType: 'range',
    targetMetrics: JSON.stringify(['E1.1.*', 'E1.2.*']),
    targetSubModules: JSON.stringify(['E1']),
    condition: JSON.stringify({
      type: 'range',
      field: 'valueNumber',
      operator: 'gte',
      params: [0],
    }),
    severity: 'error',
    message: '指标 {metricCode} 碳排放量不能为负数，当前值: {value}',
    suggestion: '碳排放量应为非负数，如有碳汇请单独填写',
    triggerOn: 'realtime',
    priority: 20,
    enabled: true,
    applicablePeriods: 'all',
  },
  {
    code: 'CR012',
    name: '员工人数合理性检查',
    description: '员工人数应大于0且在合理范围内',
    ruleType: 'range',
    targetMetrics: JSON.stringify(['S1.1.1', 'S1.1.2']),
    targetSubModules: JSON.stringify(['S1']),
    condition: JSON.stringify({
      type: 'range',
      field: 'valueNumber',
      operator: 'between',
      params: [1, 1000000],
    }),
    severity: 'warning',
    message: '指标 {metricCode} 员工人数 {value} 可能不在合理范围内',
    suggestion: '请确认员工人数数据是否正确',
    triggerOn: 'realtime',
    priority: 30,
    enabled: true,
    applicablePeriods: 'all',
  },
  {
    code: 'CR013',
    name: '碳排放同比异常检查',
    description: '碳排放量同比变化超过50%需要关注',
    ruleType: 'threshold',
    targetMetrics: JSON.stringify(['E1.1', 'E1.2']),
    targetSubModules: JSON.stringify(['E1']),
    condition: JSON.stringify({
      type: 'threshold',
      thresholdType: 'yoy',
      thresholdValue: 50,
    }),
    severity: 'warning',
    message:
      '指标 {metricCode} 同比变化率 {changeRate}% 超过阈值(±50%)，当前值: {value}，去年同期: {previousValue}',
    suggestion: '碳排放量大幅变化可能需要在报告中说明原因',
    triggerOn: 'submit',
    priority: 40,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR014',
    name: '能源消耗同比异常检查',
    description: '能源消耗量同比变化超过30%需要关注',
    ruleType: 'threshold',
    targetMetrics: JSON.stringify(['E3.1.*', 'E3.2.*']),
    targetSubModules: JSON.stringify(['E3']),
    condition: JSON.stringify({
      type: 'threshold',
      thresholdType: 'yoy',
      thresholdValue: 30,
    }),
    severity: 'warning',
    message: '指标 {metricCode} 同比变化率 {changeRate}% 超过阈值(±30%)',
    suggestion: '能源消耗大幅变化可能需要说明原因（如产能变化、节能措施等）',
    triggerOn: 'submit',
    priority: 40,
    enabled: true,
    applicablePeriods: 'yearly',
  },

  // ============ 3. 业务逻辑检查规则 ============
  {
    code: 'CR020',
    name: '碳排放总量一致性检查',
    description: '范围1+范围2+范围3排放量应等于总排放量',
    ruleType: 'consistency',
    targetMetrics: JSON.stringify(['E1.1', 'E1.1.1', 'E1.1.2', 'E1.1.3']),
    targetSubModules: JSON.stringify(['E1']),
    condition: JSON.stringify({
      type: 'consistency',
      expression: 'E1.1.1 + E1.1.2 + E1.1.3 == E1.1',
    }),
    severity: 'error',
    message: '碳排放总量与分项之和不一致: 范围1({E1.1.1}) + 范围2({E1.1.2}) + 范围3({E1.1.3}) ≠ 总量({E1.1})',
    suggestion: '请检查各范围排放量数据，确保总计正确',
    triggerOn: 'submit',
    priority: 15,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR021',
    name: '废物回收率合理性检查',
    description: '废物回收率不应超过100%',
    ruleType: 'range',
    targetMetrics: JSON.stringify(['E4.1.3']),
    targetSubModules: JSON.stringify(['E4']),
    condition: JSON.stringify({
      type: 'range',
      field: 'valueNumber',
      operator: 'lte',
      params: [100],
    }),
    severity: 'error',
    message: '废物回收率 {value}% 超过100%，数据异常',
    suggestion: '回收率 = 回收量/产生量 × 100%，不应超过100%',
    triggerOn: 'realtime',
    priority: 20,
    enabled: true,
    applicablePeriods: 'all',
  },
  {
    code: 'CR022',
    name: '危废合规处置率检查',
    description: '危险废物应100%合规处置',
    ruleType: 'range',
    targetMetrics: JSON.stringify(['E4.2.2']),
    targetSubModules: JSON.stringify(['E4']),
    condition: JSON.stringify({
      type: 'range',
      field: 'valueNumber',
      operator: 'eq',
      params: [100],
    }),
    severity: 'warning',
    message: '危险废物合规处置率 {value}% 未达到100%',
    suggestion: '根据法规要求，危险废物应100%交由有资质单位处置',
    triggerOn: 'submit',
    priority: 25,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR023',
    name: '女性员工比例合理性检查',
    description: '女性员工比例应在合理范围内',
    ruleType: 'range',
    targetMetrics: JSON.stringify(['S1.2.1']),
    targetSubModules: JSON.stringify(['S1']),
    condition: JSON.stringify({
      type: 'range',
      field: 'valueNumber',
      operator: 'between',
      params: [0, 100],
    }),
    severity: 'error',
    message: '女性员工比例 {value}% 不在有效范围内',
    suggestion: '比例值应在0-100%之间',
    triggerOn: 'realtime',
    priority: 20,
    enabled: true,
    applicablePeriods: 'all',
  },

  // ============ 4. 法规合规检查规则 ============
  {
    code: 'CR030',
    name: '上交所ESG披露-环境必填项',
    description: '根据上交所《上市公司可持续发展报告指引》，环境类核心指标必须披露',
    ruleType: 'regulation',
    targetMetrics: JSON.stringify(['E1.1', 'E1.2', 'E2.1', 'E3.1']),
    targetSubModules: JSON.stringify(['E1', 'E2', 'E3']),
    condition: JSON.stringify({
      type: 'regulation',
      standard: 'SSE-ESG-2024',
      article: '第四章',
      requiredMetrics: ['E1.1', 'E1.2', 'E2.1', 'E3.1'],
    }),
    severity: 'error',
    regulation: '上交所《上市公司可持续发展报告指引》',
    message: '指标 {metricCode} 根据上交所ESG披露指引必须披露',
    suggestion: '该指标为上交所强制披露项，请确保填写完整',
    triggerOn: 'submit',
    priority: 5,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR031',
    name: '上交所ESG披露-社会必填项',
    description: '根据上交所《上市公司可持续发展报告指引》，社会类核心指标必须披露',
    ruleType: 'regulation',
    targetMetrics: JSON.stringify(['S1.1.1', 'S1.2.1', 'S2.1.1', 'S3.1.1']),
    targetSubModules: JSON.stringify(['S1', 'S2', 'S3']),
    condition: JSON.stringify({
      type: 'regulation',
      standard: 'SSE-ESG-2024',
      article: '第五章',
      requiredMetrics: ['S1.1.1', 'S1.2.1', 'S2.1.1', 'S3.1.1'],
    }),
    severity: 'error',
    regulation: '上交所《上市公司可持续发展报告指引》',
    message: '指标 {metricCode} 根据上交所ESG披露指引必须披露',
    suggestion: '该指标为上交所强制披露项，请确保填写完整',
    triggerOn: 'submit',
    priority: 5,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR032',
    name: '上交所ESG披露-治理必填项',
    description: '根据上交所《上市公司可持续发展报告指引》，治理类核心指标必须披露',
    ruleType: 'regulation',
    targetMetrics: JSON.stringify(['G1.1.1', 'G1.2.1', 'G2.1.1']),
    targetSubModules: JSON.stringify(['G1', 'G2']),
    condition: JSON.stringify({
      type: 'regulation',
      standard: 'SSE-ESG-2024',
      article: '第六章',
      requiredMetrics: ['G1.1.1', 'G1.2.1', 'G2.1.1'],
    }),
    severity: 'error',
    regulation: '上交所《上市公司可持续发展报告指引》',
    message: '指标 {metricCode} 根据上交所ESG披露指引必须披露',
    suggestion: '该指标为上交所强制披露项，请确保填写完整',
    triggerOn: 'submit',
    priority: 5,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR033',
    name: 'GRI标准-碳排放披露',
    description: '根据GRI 305标准，碳排放数据需按范围分类披露',
    ruleType: 'regulation',
    targetMetrics: JSON.stringify(['E1.1.1', 'E1.1.2', 'E1.1.3']),
    targetSubModules: JSON.stringify(['E1']),
    condition: JSON.stringify({
      type: 'regulation',
      standard: 'GRI 305',
      requiredMetrics: ['E1.1.1', 'E1.1.2', 'E1.1.3'],
    }),
    severity: 'warning',
    regulation: 'GRI 305: 排放',
    message: '指标 {metricCode} 根据GRI 305标准建议披露',
    suggestion: '建议按GRI标准分别披露范围1、范围2、范围3排放',
    triggerOn: 'submit',
    priority: 15,
    enabled: true,
    applicablePeriods: 'yearly',
  },
  {
    code: 'CR034',
    name: 'TCFD气候相关披露',
    description: '根据TCFD框架，需披露气候相关风险和机遇',
    ruleType: 'regulation',
    targetMetrics: JSON.stringify(['E1.*', 'G2.3.*']),
    targetSubModules: JSON.stringify(['E1', 'G2']),
    condition: JSON.stringify({
      type: 'regulation',
      standard: 'TCFD',
      requiredMetrics: ['E1.1', 'E1.2'],
    }),
    severity: 'info',
    regulation: 'TCFD气候相关财务信息披露建议',
    message: '指标 {metricCode} 属于TCFD气候披露建议范围',
    suggestion: '建议参考TCFD框架完善气候相关信息披露',
    triggerOn: 'submit',
    priority: 50,
    enabled: true,
    applicablePeriods: 'yearly',
  },

  // ============ 5. 数据质量检查规则 ============
  {
    code: 'CR040',
    name: '数据精度检查',
    description: '财务相关数据不应有过多小数位',
    ruleType: 'format',
    targetMetrics: JSON.stringify(['*.amount', '*.cost', '*.revenue']),
    targetSubModules: JSON.stringify(['*']),
    condition: JSON.stringify({
      type: 'format',
      format: '^-?\\d+(\\.\\d{1,2})?$',
    }),
    severity: 'warning',
    message: '指标 {metricCode} 的值 {value} 小数位过多',
    suggestion: '财务数据建议保留2位小数',
    triggerOn: 'realtime',
    priority: 60,
    enabled: false, // 默认禁用，按需启用
    applicablePeriods: 'all',
  },
]

/**
 * 执行合规规则种子数据初始化
 */
export async function seedComplianceRules(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0

  for (const rule of PRESET_RULES) {
    // 检查是否已存在
    const existing = await db.query.complianceRules.findFirst({
      where: (rules, { eq }) => eq(rules.code, rule.code),
    })

    if (existing) {
      skipped++
      continue
    }

    // 插入规则
    await db.insert(complianceRules).values(rule)
    inserted++
  }

  return { inserted, skipped }
}

/**
 * 获取预置规则列表（用于展示）
 */
export function getPresetRules(): typeof PRESET_RULES {
  return PRESET_RULES
}

/**
 * 重置合规规则为预置状态
 * 警告：此操作会删除所有自定义规则
 */
export async function resetComplianceRules(): Promise<void> {
  // 删除所有规则
  await db.delete(complianceRules)

  // 重新插入预置规则
  for (const rule of PRESET_RULES) {
    await db.insert(complianceRules).values(rule)
  }
}
