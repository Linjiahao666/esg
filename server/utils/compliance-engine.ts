/**
 * ESG 合规性检查引擎
 *
 * 负责执行各类合规性检查规则，包括：
 * - 数据完整性检查（必填字段）
 * - 数值范围检查（min/max/between）
 * - 逻辑一致性检查（跨指标验证）
 * - 阈值预警检查（同比/环比异常）
 * - 法规合规检查（披露要求）
 */

import {
  db,
  complianceRules,
  complianceResults,
  complianceAuditLogs,
  complianceCheckBatches,
  esgRecords,
  esgMetrics,
  esgCategories,
  esgSubModules,
} from '../database'
import { eq, and, inArray, like, or, desc, sql } from 'drizzle-orm'
import type {
  ComplianceRule,
  NewComplianceResult,
  NewComplianceAuditLog,
  EsgRecord,
  EsgMetric,
} from '../database/schema'

// ============ 类型定义 ============

// 检查结果状态
export type CheckStatus = 'pass' | 'fail' | 'warning' | 'skipped'

// 解决状态
export type ResolveStatus = 'pending' | 'resolved' | 'ignored' | 'deferred'

// 严重级别
export type Severity = 'error' | 'warning' | 'info'

// 规则类型
export type RuleType = 'required' | 'range' | 'format' | 'consistency' | 'threshold' | 'regulation'

// 触发时机
export type TriggerOn = 'realtime' | 'submit' | 'batch' | 'scheduled'

// 操作符类型
export type Operator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'between'
  | 'regex'
  | 'empty'
  | 'notEmpty'

// 规则条件配置
export interface RuleCondition {
  type: RuleType
  field?: string // 检查的字段: value, valueNumber, valueText
  operator?: Operator
  params?: any[] // 参数列表
  expression?: string // 一致性检查表达式
  standard?: string // 法规标准
  article?: string // 条款
  requiredMetrics?: string[] // 法规要求的必填指标
  thresholdType?: 'yoy' | 'qoq' | 'absolute' // 阈值类型：同比/环比/绝对值
  thresholdValue?: number // 阈值
  format?: string // 格式正则表达式
}

// 单条检查结果
export interface CheckResult {
  passed: boolean
  status: CheckStatus
  ruleCode: string
  ruleName: string
  severity: Severity
  message: string
  suggestion?: string
  metricCode?: string
  checkedValue?: any
  expectedValue?: any
  details?: Record<string, any>
}

// 批量检查结果
export interface BatchCheckResult {
  success: boolean
  total: number
  passed: number
  failed: number
  warnings: number
  skipped: number
  results: CheckResult[]
  errors: CheckResult[]
  warnings_list: CheckResult[]
}

// 检查上下文
export interface CheckContext {
  period: string
  orgUnitId?: number
  userId?: number
  triggerType?: 'manual' | 'auto' | 'scheduled'
  allRecords?: Map<string, any> // 当前周期所有记录（用于跨指标检查）
  historicalData?: Map<string, any[]> // 历史数据（用于趋势检查）
}

// 指标数据输入
export interface MetricDataInput {
  metricCode: string
  value: any
  valueNumber?: number | null
  valueText?: string | null
  valueJson?: any
  status?: string
}

// ============ 合规检查引擎类 ============

export class ComplianceEngine {
  private period: string
  private orgUnitId?: number
  private userId?: number
  private cachedRules: ComplianceRule[] | null = null
  private allRecords: Map<string, any> = new Map()

  constructor(period: string, orgUnitId?: number, userId?: number) {
    this.period = period
    this.orgUnitId = orgUnitId
    this.userId = userId
  }

  /**
   * 获取所有启用的合规规则
   */
  async getRules(triggerOn?: TriggerOn): Promise<ComplianceRule[]> {
    if (this.cachedRules && !triggerOn) {
      return this.cachedRules
    }

    const conditions = [eq(complianceRules.enabled, true)]

    if (triggerOn) {
      conditions.push(
        or(eq(complianceRules.triggerOn, triggerOn), eq(complianceRules.triggerOn, 'realtime'))!
      )
    }

    const rules = await db
      .select()
      .from(complianceRules)
      .where(and(...conditions))
      .orderBy(complianceRules.priority)

    if (!triggerOn) {
      this.cachedRules = rules
    }

    return rules
  }

  /**
   * 获取适用于指定指标的规则
   */
  async getRulesForMetric(metricCode: string, triggerOn?: TriggerOn): Promise<ComplianceRule[]> {
    const allRules = await this.getRules(triggerOn)

    return allRules.filter((rule) => {
      // 检查目标指标
      if (rule.targetMetrics) {
        const targets = JSON.parse(rule.targetMetrics) as string[]
        if (targets[0] !== '*' && !targets.includes(metricCode)) {
          // 支持通配符匹配，如 "E1.*" 匹配 "E1.1.1"
          const hasWildcardMatch = targets.some((target) => {
            if (target.endsWith('*')) {
              const prefix = target.slice(0, -1)
              return metricCode.startsWith(prefix)
            }
            return false
          })
          if (!hasWildcardMatch) return false
        }
      }

      // 检查适用周期
      if (rule.applicablePeriods && rule.applicablePeriods !== 'all') {
        const periods = rule.applicablePeriods.split(',')
        const periodType = this.detectPeriodType(this.period)
        if (!periods.includes(periodType)) return false
      }

      return true
    })
  }

  /**
   * 检测周期类型
   */
  private detectPeriodType(period: string): string {
    if (/^\d{4}$/.test(period)) return 'yearly'
    if (/^\d{4}-Q[1-4]$/.test(period)) return 'quarterly'
    if (/^\d{4}-\d{2}$/.test(period)) return 'monthly'
    return 'yearly'
  }

  /**
   * 检查单条指标数据
   */
  async checkRecord(
    data: MetricDataInput,
    triggerOn: TriggerOn = 'realtime'
  ): Promise<BatchCheckResult> {
    const rules = await this.getRulesForMetric(data.metricCode, triggerOn)
    const results: CheckResult[] = []

    for (const rule of rules) {
      const result = await this.executeRule(rule, data)
      results.push(result)
    }

    return this.summarizeResults(results)
  }

  /**
   * 批量检查多条指标数据
   */
  async checkBatch(
    records: MetricDataInput[],
    triggerOn: TriggerOn = 'submit'
  ): Promise<BatchCheckResult> {
    // 构建记录Map用于跨指标检查
    this.allRecords = new Map(records.map((r) => [r.metricCode, r]))

    const allResults: CheckResult[] = []

    for (const record of records) {
      const recordResult = await this.checkRecord(record, triggerOn)
      allResults.push(...recordResult.results)
    }

    // 执行全局一致性检查
    const consistencyRules = await this.getRules(triggerOn)
    for (const rule of consistencyRules.filter((r) => r.ruleType === 'consistency')) {
      const result = await this.executeConsistencyRule(rule)
      if (result) allResults.push(result)
    }

    return this.summarizeResults(allResults)
  }

  /**
   * 执行单条规则检查
   */
  private async executeRule(rule: ComplianceRule, data: MetricDataInput): Promise<CheckResult> {
    const condition = JSON.parse(rule.condition) as RuleCondition
    const baseResult: CheckResult = {
      passed: true,
      status: 'pass',
      ruleCode: rule.code,
      ruleName: rule.name,
      severity: rule.severity as Severity,
      message: '',
      suggestion: rule.suggestion || undefined,
      metricCode: data.metricCode,
    }

    try {
      switch (rule.ruleType) {
        case 'required':
          return this.checkRequired(baseResult, data, condition)
        case 'range':
          return this.checkRange(baseResult, data, condition)
        case 'format':
          return this.checkFormat(baseResult, data, condition)
        case 'threshold':
          return await this.checkThreshold(baseResult, data, condition)
        case 'regulation':
          return this.checkRegulation(baseResult, data, condition, rule)
        default:
          return { ...baseResult, status: 'skipped', message: '未知规则类型' }
      }
    } catch (error: any) {
      return {
        ...baseResult,
        passed: false,
        status: 'fail',
        message: `规则执行错误: ${error.message}`,
      }
    }
  }

  /**
   * 必填检查
   */
  private checkRequired(
    baseResult: CheckResult,
    data: MetricDataInput,
    _condition: RuleCondition
  ): CheckResult {
    const value = this.getValue(data)
    const isEmpty =
      value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)

    if (isEmpty) {
      return {
        ...baseResult,
        passed: false,
        status: 'fail',
        message: this.formatMessage(baseResult.ruleName, { metricCode: data.metricCode }),
        checkedValue: value,
        expectedValue: '非空值',
      }
    }

    return { ...baseResult, message: '必填检查通过' }
  }

  /**
   * 范围检查
   */
  private checkRange(
    baseResult: CheckResult,
    data: MetricDataInput,
    condition: RuleCondition
  ): CheckResult {
    const value = data.valueNumber

    // 如果值为空，跳过范围检查（由必填规则处理）
    if (value === null || value === undefined) {
      return { ...baseResult, status: 'skipped', message: '值为空，跳过范围检查' }
    }

    const { operator, params } = condition

    let passed = true
    let expectedValue = ''

    switch (operator) {
      case 'gt':
        passed = value > params![0]
        expectedValue = `> ${params![0]}`
        break
      case 'gte':
        passed = value >= params![0]
        expectedValue = `>= ${params![0]}`
        break
      case 'lt':
        passed = value < params![0]
        expectedValue = `< ${params![0]}`
        break
      case 'lte':
        passed = value <= params![0]
        expectedValue = `<= ${params![0]}`
        break
      case 'between':
        passed = value >= params![0] && value <= params![1]
        expectedValue = `${params![0]} ~ ${params![1]}`
        break
      case 'eq':
        passed = value === params![0]
        expectedValue = `= ${params![0]}`
        break
      case 'ne':
        passed = value !== params![0]
        expectedValue = `!= ${params![0]}`
        break
    }

    if (!passed) {
      return {
        ...baseResult,
        passed: false,
        status: baseResult.severity === 'error' ? 'fail' : 'warning',
        message: this.formatMessage(baseResult.ruleName, {
          metricCode: data.metricCode,
          value,
          threshold: expectedValue,
        }),
        checkedValue: value,
        expectedValue,
      }
    }

    return { ...baseResult, message: '范围检查通过', checkedValue: value }
  }

  /**
   * 格式检查
   */
  private checkFormat(
    baseResult: CheckResult,
    data: MetricDataInput,
    condition: RuleCondition
  ): CheckResult {
    const value = data.valueText

    if (!value) {
      return { ...baseResult, status: 'skipped', message: '文本值为空，跳过格式检查' }
    }

    if (!condition.format) {
      return { ...baseResult, status: 'skipped', message: '未配置格式规则' }
    }

    const regex = new RegExp(condition.format)
    const passed = regex.test(value)

    if (!passed) {
      return {
        ...baseResult,
        passed: false,
        status: baseResult.severity === 'error' ? 'fail' : 'warning',
        message: this.formatMessage(baseResult.ruleName, {
          metricCode: data.metricCode,
          value,
          format: condition.format,
        }),
        checkedValue: value,
        expectedValue: `符合格式: ${condition.format}`,
      }
    }

    return { ...baseResult, message: '格式检查通过', checkedValue: value }
  }

  /**
   * 阈值预警检查（同比/环比）
   */
  private async checkThreshold(
    baseResult: CheckResult,
    data: MetricDataInput,
    condition: RuleCondition
  ): Promise<CheckResult> {
    const currentValue = data.valueNumber

    if (currentValue === null || currentValue === undefined) {
      return { ...baseResult, status: 'skipped', message: '当前值为空，跳过阈值检查' }
    }

    // 获取历史数据进行对比
    const thresholdType = condition.thresholdType === 'absolute' ? 'yoy' : (condition.thresholdType || 'yoy')
    const previousPeriod = this.getPreviousPeriod(thresholdType as 'yoy' | 'qoq' | 'mom')
    const previousRecord = await this.getHistoricalRecord(data.metricCode, previousPeriod)

    if (!previousRecord || previousRecord.valueNumber === null) {
      return { ...baseResult, status: 'skipped', message: '无历史数据，跳过阈值检查' }
    }

    const previousValue = previousRecord.valueNumber!
    let changeRate: number

    if (previousValue === 0) {
      changeRate = currentValue === 0 ? 0 : 100 // 从0变为非0视为100%变化
    } else {
      changeRate = ((currentValue - previousValue) / Math.abs(previousValue)) * 100
    }

    const threshold = condition.thresholdValue || 50 // 默认50%变化率阈值
    const passed = Math.abs(changeRate) <= threshold

    if (!passed) {
      return {
        ...baseResult,
        passed: false,
        status: 'warning',
        message: this.formatMessage(baseResult.ruleName, {
          metricCode: data.metricCode,
          value: currentValue,
          previousValue,
          changeRate: changeRate.toFixed(2),
          threshold,
        }),
        checkedValue: currentValue,
        expectedValue: `变化率在 ±${threshold}% 以内`,
        details: {
          previousPeriod,
          previousValue,
          currentValue,
          changeRate: changeRate.toFixed(2) + '%',
        },
      }
    }

    return {
      ...baseResult,
      message: '阈值检查通过',
      checkedValue: currentValue,
      details: { previousValue, changeRate: changeRate.toFixed(2) + '%' },
    }
  }

  /**
   * 法规合规检查
   */
  private checkRegulation(
    baseResult: CheckResult,
    data: MetricDataInput,
    condition: RuleCondition,
    rule: ComplianceRule
  ): CheckResult {
    // 法规合规通常是检查指标是否填写
    const value = this.getValue(data)
    const isEmpty =
      value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)

    if (isEmpty) {
      return {
        ...baseResult,
        passed: false,
        status: baseResult.severity === 'error' ? 'fail' : 'warning',
        message: this.formatMessage(baseResult.ruleName, {
          metricCode: data.metricCode,
          standard: condition.standard || rule.regulation,
          article: condition.article,
        }),
        checkedValue: value,
        expectedValue: '根据法规要求必须披露',
        details: {
          regulation: rule.regulation,
          standard: condition.standard,
          article: condition.article,
        },
      }
    }

    return {
      ...baseResult,
      message: '法规合规检查通过',
      details: { regulation: rule.regulation },
    }
  }

  /**
   * 执行一致性检查（跨指标）
   */
  private async executeConsistencyRule(rule: ComplianceRule): Promise<CheckResult | null> {
    const condition = JSON.parse(rule.condition) as RuleCondition

    if (!condition.expression) return null

    const baseResult: CheckResult = {
      passed: true,
      status: 'pass',
      ruleCode: rule.code,
      ruleName: rule.name,
      severity: rule.severity as Severity,
      message: '',
      suggestion: rule.suggestion || undefined,
    }

    try {
      // 解析表达式，如 "E1.1.1 + E1.1.2 + E1.1.3 == E1.1"
      const result = await this.evaluateExpression(condition.expression)

      if (!result.valid) {
        return {
          ...baseResult,
          status: 'skipped',
          message: `无法验证: ${result.reason}`,
        }
      }

      if (!result.passed) {
        return {
          ...baseResult,
          passed: false,
          status: baseResult.severity === 'error' ? 'fail' : 'warning',
          message: this.formatMessage(rule.message, {
            expression: condition.expression,
            leftValue: result.leftValue,
            rightValue: result.rightValue,
          }),
          details: result.details,
        }
      }

      return { ...baseResult, message: '一致性检查通过', details: result.details }
    } catch (error: any) {
      return {
        ...baseResult,
        passed: false,
        status: 'fail',
        message: `一致性检查执行错误: ${error.message}`,
      }
    }
  }

  /**
   * 计算表达式
   */
  private async evaluateExpression(
    expression: string
  ): Promise<{ valid: boolean; passed?: boolean; reason?: string; leftValue?: number; rightValue?: number; details?: any }> {
    // 支持的操作符: ==, !=, >, <, >=, <=
    const operatorMatch = expression.match(/(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)/)

    if (!operatorMatch) {
      return { valid: false, reason: '无效的表达式格式' }
    }

    const [, leftExpr, operator, rightExpr] = operatorMatch

    if (!leftExpr || !rightExpr) {
      return { valid: false, reason: '表达式解析失败' }
    }

    const leftValue = await this.calculateExpressionSide(leftExpr.trim())
    const rightValue = await this.calculateExpressionSide(rightExpr.trim())

    if (leftValue === null || rightValue === null) {
      return { valid: false, reason: '部分指标数据缺失' }
    }

    let passed = false
    switch (operator) {
      case '==':
        passed = Math.abs(leftValue - rightValue) < 0.001 // 浮点数容差
        break
      case '!=':
        passed = Math.abs(leftValue - rightValue) >= 0.001
        break
      case '>':
        passed = leftValue > rightValue
        break
      case '<':
        passed = leftValue < rightValue
        break
      case '>=':
        passed = leftValue >= rightValue
        break
      case '<=':
        passed = leftValue <= rightValue
        break
    }

    return {
      valid: true,
      passed,
      leftValue,
      rightValue,
      details: { leftExpr, rightExpr, operator, leftValue, rightValue },
    }
  }

  /**
   * 计算表达式一侧的值
   */
  private async calculateExpressionSide(expr: string): Promise<number | null> {
    // 简单表达式解析，支持 + - * /
    const tokens = expr.split(/\s*([+\-*/])\s*/)
    let result: number | null = null
    let currentOp = '+'

    for (const token of tokens) {
      if (['+', '-', '*', '/'].includes(token)) {
        currentOp = token
        continue
      }

      let value: number | null = null

      // 检查是否是数字
      if (/^[\d.]+$/.test(token)) {
        value = parseFloat(token)
      } else {
        // 是指标代码，获取值
        value = await this.getMetricValue(token)
      }

      if (value === null) return null

      if (result === null) {
        result = value
      } else {
        switch (currentOp) {
          case '+':
            result += value
            break
          case '-':
            result -= value
            break
          case '*':
            result *= value
            break
          case '/':
            result = value !== 0 ? result / value : null
            break
        }
      }
    }

    return result
  }

  /**
   * 获取指标值
   */
  private async getMetricValue(metricCode: string): Promise<number | null> {
    // 先从当前批次数据中查找
    if (this.allRecords.has(metricCode)) {
      const record = this.allRecords.get(metricCode)
      return record.valueNumber ?? null
    }

    // 从数据库查询
    const record = await this.getHistoricalRecord(metricCode, this.period)
    return record?.valueNumber ?? null
  }

  /**
   * 获取历史记录
   */
  private async getHistoricalRecord(metricCode: string, period: string): Promise<EsgRecord | null> {
    const metric = await db.query.esgMetrics.findFirst({
      where: eq(esgMetrics.code, metricCode),
    })

    if (!metric) return null

    const record = await db.query.esgRecords.findFirst({
      where: and(
        eq(esgRecords.metricId, metric.id),
        eq(esgRecords.period, period),
        this.orgUnitId ? eq(esgRecords.orgUnitId, this.orgUnitId) : undefined
      ),
    })

    return record || null
  }

  /**
   * 获取上一个周期
   */
  private getPreviousPeriod(type: 'yoy' | 'qoq' | 'mom' = 'yoy'): string {
    const periodType = this.detectPeriodType(this.period)

    if (type === 'yoy') {
      // 同比：去年同期
      if (periodType === 'yearly') {
        return String(parseInt(this.period) - 1)
      }
      if (periodType === 'quarterly') {
        const parts = this.period.split('-Q')
        const year = parts[0] || this.period
        const quarter = parts[1] || '1'
        return `${parseInt(year) - 1}-Q${quarter}`
      }
      if (periodType === 'monthly') {
        const parts = this.period.split('-')
        const year = parts[0] || this.period
        const month = parts[1] || '01'
        return `${parseInt(year) - 1}-${month}`
      }
    }

    if (type === 'qoq') {
      // 环比：上一季度
      if (periodType === 'quarterly') {
        const parts = this.period.split('-Q')
        const year = parts[0] || this.period
        const quarter = parts[1] || '1'
        const q = parseInt(quarter)
        if (q === 1) {
          return `${parseInt(year) - 1}-Q4`
        }
        return `${year}-Q${q - 1}`
      }
    }

    if (type === 'mom') {
      // 环比：上一月
      if (periodType === 'monthly') {
        const parts = this.period.split('-')
        const year = parts[0] || this.period
        const month = parts[1] || '01'
        const m = parseInt(month)
        if (m === 1) {
          return `${parseInt(year) - 1}-12`
        }
        return `${year}-${String(m - 1).padStart(2, '0')}`
      }
    }

    return this.period
  }

  /**
   * 获取记录值
   */
  private getValue(data: MetricDataInput): any {
    if (data.value !== undefined) return data.value
    if (data.valueNumber !== null && data.valueNumber !== undefined) return data.valueNumber
    if (data.valueText) return data.valueText
    if (data.valueJson) return data.valueJson
    return null
  }

  /**
   * 格式化消息
   */
  private formatMessage(template: string, params: Record<string, any>): string {
    let message = template
    for (const [key, value] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? ''))
    }
    return message
  }

  /**
   * 汇总检查结果
   */
  private summarizeResults(results: CheckResult[]): BatchCheckResult {
    const passed = results.filter((r) => r.status === 'pass').length
    const failed = results.filter((r) => r.status === 'fail').length
    const warnings = results.filter((r) => r.status === 'warning').length
    const skipped = results.filter((r) => r.status === 'skipped').length

    return {
      success: failed === 0,
      total: results.length,
      passed,
      failed,
      warnings,
      skipped,
      results,
      errors: results.filter((r) => r.status === 'fail'),
      warnings_list: results.filter((r) => r.status === 'warning'),
    }
  }

  /**
   * 保存检查结果到数据库
   */
  async saveResults(
    results: CheckResult[],
    recordId?: number,
    triggerType: 'manual' | 'auto' | 'scheduled' = 'auto'
  ): Promise<void> {
    const toInsert: NewComplianceResult[] = []

    for (const result of results) {
      if (result.status === 'skipped') continue

      // 查找规则ID
      const rule = await db.query.complianceRules.findFirst({
        where: eq(complianceRules.code, result.ruleCode),
      })

      if (!rule) continue

      toInsert.push({
        ruleId: rule.id,
        recordId: recordId || null,
        metricCode: result.metricCode || null,
        period: this.period,
        orgUnitId: this.orgUnitId || null,
        status: result.status,
        checkedValue: result.checkedValue !== undefined ? String(result.checkedValue) : null,
        expectedValue: result.expectedValue !== undefined ? String(result.expectedValue) : null,
        details: result.details ? JSON.stringify(result.details) : null,
        triggerType,
        checkedBy: this.userId || null,
        resolveStatus: result.passed ? 'resolved' : 'pending',
      })
    }

    if (toInsert.length > 0) {
      await db.insert(complianceResults).values(toInsert)
    }
  }

  /**
   * 记录审计日志
   */
  async logAudit(
    action: string,
    targetType: string,
    targetId?: number,
    beforeSnapshot?: any,
    afterSnapshot?: any,
    description?: string
  ): Promise<void> {
    await db.insert(complianceAuditLogs).values({
      action,
      targetType,
      targetId: targetId || null,
      beforeSnapshot: beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
      afterSnapshot: afterSnapshot ? JSON.stringify(afterSnapshot) : null,
      changeDescription: description || null,
      operatorId: this.userId || null,
    })
  }
}

// ============ 辅助函数 ============

/**
 * 创建合规检查引擎实例
 */
export function createComplianceEngine(
  period: string,
  orgUnitId?: number,
  userId?: number
): ComplianceEngine {
  return new ComplianceEngine(period, orgUnitId, userId)
}

/**
 * 快速检查单条记录
 */
export async function quickCheck(
  data: MetricDataInput,
  period: string,
  triggerOn: TriggerOn = 'realtime'
): Promise<BatchCheckResult> {
  const engine = createComplianceEngine(period)
  return engine.checkRecord(data, triggerOn)
}

/**
 * 快速批量检查
 */
export async function quickBatchCheck(
  records: MetricDataInput[],
  period: string,
  triggerOn: TriggerOn = 'submit'
): Promise<BatchCheckResult> {
  const engine = createComplianceEngine(period)
  return engine.checkBatch(records, triggerOn)
}

/**
 * 检查结果是否允许保存
 */
export function canSaveWithResults(results: BatchCheckResult): boolean {
  // 只有当没有error级别的失败时才允许保存
  return results.errors.every((e) => e.severity !== 'error')
}

/**
 * 从检查结果中提取错误消息
 */
export function extractErrorMessages(results: BatchCheckResult): string[] {
  return results.errors.map((e) => e.message)
}

/**
 * 从检查结果中提取警告消息
 */
export function extractWarningMessages(results: BatchCheckResult): string[] {
  return results.warnings_list.map((w) => w.message)
}
