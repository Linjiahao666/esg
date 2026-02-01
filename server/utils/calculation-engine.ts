/**
 * ESG 指标计算引擎
 * 
 * 负责根据原始数据（员工、能源、供应商等）自动计算 ESG 指标值
 * 支持 24 个数据源、多种公式类型、依赖链计算
 */

import { db, employees, energyConsumption, carbonEmissions, wasteData, suppliers, trainingRecords, safetyIncidents, donations, environmentalCompliance, metricFormulas, calculationLogs, esgRecords, esgMetrics, waterConsumption, wasteWaterRecords, airEmissionRecords, materialConsumption, noiseRecords, employeeWorkTime, salaryRecords, boardMembers, supervisors, executives, shareholders, rdInvestment, patents, productIncidents, environmentInvestments, companyFinancials, meetingRecords, certifications } from '../database'
import { eq, and, sql, count, sum, avg, or, like } from 'drizzle-orm'

// 计算结果类型
interface CalculationResult {
  success: boolean
  value?: number | string
  unit?: string
  details?: Record<string, any>
  error?: string
}

// 公式配置类型 - 扩展支持更多计算类型
interface FormulaConfig {
  type: 'count' | 'sum' | 'avg' | 'ratio' | 'percentage' | 'custom' | 'difference' | 'yoy_rate' | 'weighted_avg' | 'metric'
  dataSource?: string
  field?: string
  filter?: Record<string, any>
  numerator?: FormulaConfig
  denominator?: FormulaConfig
  expression?: string
  multiply?: number
  // 新增字段
  metricCode?: string // 引用其他指标的计算结果
  periodOffset?: string // 周期偏移: 'previous_year', 'previous_quarter', 'previous_month'
  current?: FormulaConfig // 当前值 (用于 difference, yoy_rate)
  previous?: FormulaConfig // 前值 (用于 difference, yoy_rate)
  weights?: { value: FormulaConfig; weight: FormulaConfig }[] // 加权平均
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'last' // 周期聚合方式
}

// 指标依赖关系
interface MetricDependency {
  metricCode: string
  dependencies: string[] // 依赖的其他指标编码
}

/**
 * 计算引擎类 - 增强版
 */
export class CalculationEngine {
  private period: string
  private calculatedMetrics: Map<string, CalculationResult> = new Map()

  constructor(period: string) {
    this.period = period
  }

  /**
   * 执行单个指标计算
   */
  async calculateMetric(metricCode: string, formulaConfig?: FormulaConfig): Promise<CalculationResult> {
    // 检查是否已计算过（用于依赖链）
    if (this.calculatedMetrics.has(metricCode)) {
      return this.calculatedMetrics.get(metricCode)!
    }

    const startTime = Date.now()

    try {
      // 如果没有传入公式配置，从数据库获取
      if (!formulaConfig) {
        const metric = await db.query.esgMetrics.findFirst({
          where: eq(esgMetrics.code, metricCode)
        })
        if (!metric) {
          return { success: false, error: `指标 ${metricCode} 不存在` }
        }

        const formula = await db.query.metricFormulas.findFirst({
          where: and(
            eq(metricFormulas.metricId, metric.id),
            eq(metricFormulas.isActive, true)
          )
        })

        if (!formula) {
          return { success: false, error: `指标 ${metricCode} 没有配置计算公式` }
        }

        formulaConfig = JSON.parse(formula.formula) as FormulaConfig
      }

      // 执行计算
      const result = await this.executeFormula(formulaConfig)

      // 缓存结果
      this.calculatedMetrics.set(metricCode, result)

      // 记录计算日志
      const executionTime = Date.now() - startTime
      await this.logCalculation(metricCode, result, executionTime)

      return result
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  /**
   * 执行公式计算
   */
  private async executeFormula(config: FormulaConfig): Promise<CalculationResult> {
    switch (config.type) {
      case 'count':
        return this.executeCount(config)
      case 'sum':
        return this.executeSum(config)
      case 'avg':
        return this.executeAvg(config)
      case 'ratio':
        return this.executeRatio(config)
      case 'percentage':
        return this.executePercentage(config)
      case 'custom':
        return this.executeCustom(config)
      case 'difference':
        return this.executeDifference(config)
      case 'yoy_rate':
        return this.executeYoyRate(config)
      case 'weighted_avg':
        return this.executeWeightedAvg(config)
      case 'metric':
        return this.executeMetricReference(config)
      default:
        return { success: false, error: `不支持的公式类型: ${config.type}` }
    }
  }

  /**
   * 计数类型计算
   */
  private async executeCount(config: FormulaConfig): Promise<CalculationResult> {
    const table = this.getTable(config.dataSource!)
    if (!table) {
      return { success: false, error: `数据源 ${config.dataSource} 不存在` }
    }

    try {
      const conditions = this.buildConditions(config.dataSource!, config.filter)
      const result = await db.select({ count: count() }).from(table).where(conditions)
      return {
        success: true,
        value: result[0]?.count || 0,
        details: { filter: config.filter }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  /**
   * 求和类型计算
   */
  private async executeSum(config: FormulaConfig): Promise<CalculationResult> {
    const table = this.getTable(config.dataSource!)
    if (!table) {
      return { success: false, error: `数据源 ${config.dataSource} 不存在` }
    }
    if (!config.field) {
      return { success: false, error: '求和计算需要指定字段' }
    }

    try {
      const conditions = this.buildConditions(config.dataSource!, config.filter)
      const field = (table as any)[config.field]
      if (!field) {
        return { success: false, error: `字段 ${config.field} 不存在` }
      }

      const result = await db.select({ total: sum(field) }).from(table).where(conditions)
      let value = Number(result[0]?.total) || 0
      if (config.multiply) {
        value *= config.multiply
      }
      return {
        success: true,
        value,
        details: { field: config.field, filter: config.filter }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  /**
   * 平均值类型计算
   */
  private async executeAvg(config: FormulaConfig): Promise<CalculationResult> {
    const table = this.getTable(config.dataSource!)
    if (!table) {
      return { success: false, error: `数据源 ${config.dataSource} 不存在` }
    }
    if (!config.field) {
      return { success: false, error: '平均值计算需要指定字段' }
    }

    try {
      const conditions = this.buildConditions(config.dataSource!, config.filter)
      const field = (table as any)[config.field]
      if (!field) {
        return { success: false, error: `字段 ${config.field} 不存在` }
      }

      const result = await db.select({ average: avg(field) }).from(table).where(conditions)
      return {
        success: true,
        value: Number(result[0]?.average) || 0,
        details: { field: config.field, filter: config.filter }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  /**
   * 比率类型计算
   */
  private async executeRatio(config: FormulaConfig): Promise<CalculationResult> {
    if (!config.numerator || !config.denominator) {
      return { success: false, error: '比率计算需要指定分子和分母' }
    }

    const numeratorResult = await this.executeFormula(config.numerator)
    if (!numeratorResult.success) {
      return { success: false, error: `分子计算失败: ${numeratorResult.error}` }
    }

    const denominatorResult = await this.executeFormula(config.denominator)
    if (!denominatorResult.success) {
      return { success: false, error: `分母计算失败: ${denominatorResult.error}` }
    }

    const numerator = Number(numeratorResult.value) || 0
    const denominator = Number(denominatorResult.value) || 0

    if (denominator === 0) {
      return {
        success: true,
        value: 0,
        details: { numerator, denominator, note: '分母为0' }
      }
    }

    return {
      success: true,
      value: numerator / denominator,
      details: { numerator, denominator }
    }
  }

  /**
   * 百分比类型计算
   */
  private async executePercentage(config: FormulaConfig): Promise<CalculationResult> {
    const ratioResult = await this.executeRatio(config)
    if (!ratioResult.success) {
      return ratioResult
    }

    return {
      success: true,
      value: Number(ratioResult.value) * 100,
      unit: '%',
      details: ratioResult.details
    }
  }

  /**
   * 自定义表达式计算
   */
  private async executeCustom(config: FormulaConfig): Promise<CalculationResult> {
    // 自定义计算需要更复杂的表达式解析
    // 这里提供一个简化版本
    if (!config.expression) {
      return { success: false, error: '自定义计算需要指定表达式' }
    }

    try {
      // 解析表达式中的变量并替换
      // 例如: "{employees.total} - {employees.resigned}"
      const expression = config.expression
      const variablePattern = /\{([^}]+)\}/g
      let processedExpression = expression
      const variables: Record<string, number> = {}

      const matches = expression.matchAll(variablePattern)
      for (const match of matches) {
        const varName = match[1]
        const [source, metric] = varName.split('.')

        // 根据变量获取值
        const value = await this.getVariableValue(source, metric)
        variables[varName] = value
        processedExpression = processedExpression.replace(match[0], String(value))
      }

      // 安全地计算表达式（仅支持基本数学运算）
      const result = this.safeEval(processedExpression)

      return {
        success: true,
        value: result,
        details: { expression: config.expression, variables }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  /**
   * 差值计算 (当前值 - 前值)
   */
  private async executeDifference(config: FormulaConfig): Promise<CalculationResult> {
    if (!config.current || !config.previous) {
      return { success: false, error: '差值计算需要指定当前值和前值配置' }
    }

    const currentResult = await this.executeFormula(config.current)
    if (!currentResult.success) {
      return { success: false, error: `当前值计算失败: ${currentResult.error}` }
    }

    const previousResult = await this.executeFormula(config.previous)
    if (!previousResult.success) {
      return { success: false, error: `前值计算失败: ${previousResult.error}` }
    }

    const current = Number(currentResult.value) || 0
    const previous = Number(previousResult.value) || 0

    return {
      success: true,
      value: current - previous,
      details: { current, previous }
    }
  }

  /**
   * 同比增长率计算 ((当前值 - 前值) / 前值 * 100)
   */
  private async executeYoyRate(config: FormulaConfig): Promise<CalculationResult> {
    if (!config.current || !config.previous) {
      return { success: false, error: '同比增长率计算需要指定当前值和前值配置' }
    }

    const currentResult = await this.executeFormula(config.current)
    if (!currentResult.success) {
      return { success: false, error: `当前值计算失败: ${currentResult.error}` }
    }

    const previousResult = await this.executeFormula(config.previous)
    if (!previousResult.success) {
      return { success: false, error: `前值计算失败: ${previousResult.error}` }
    }

    const current = Number(currentResult.value) || 0
    const previous = Number(previousResult.value) || 0

    if (previous === 0) {
      return {
        success: true,
        value: current > 0 ? 100 : 0, // 前值为0时，有增长算100%，否则0%
        unit: '%',
        details: { current, previous, note: '基期值为0' }
      }
    }

    const rate = ((current - previous) / Math.abs(previous)) * 100

    return {
      success: true,
      value: Math.round(rate * 100) / 100, // 保留两位小数
      unit: '%',
      details: { current, previous }
    }
  }

  /**
   * 加权平均计算
   */
  private async executeWeightedAvg(config: FormulaConfig): Promise<CalculationResult> {
    if (!config.weights || config.weights.length === 0) {
      return { success: false, error: '加权平均计算需要指定权重配置' }
    }

    let totalWeightedValue = 0
    let totalWeight = 0
    const details: Array<{ value: number; weight: number }> = []

    for (const item of config.weights) {
      const valueResult = await this.executeFormula(item.value)
      if (!valueResult.success) {
        return { success: false, error: `值计算失败: ${valueResult.error}` }
      }

      const weightResult = await this.executeFormula(item.weight)
      if (!weightResult.success) {
        return { success: false, error: `权重计算失败: ${weightResult.error}` }
      }

      const value = Number(valueResult.value) || 0
      const weight = Number(weightResult.value) || 0

      totalWeightedValue += value * weight
      totalWeight += weight
      details.push({ value, weight })
    }

    if (totalWeight === 0) {
      return {
        success: true,
        value: 0,
        details: { items: details, note: '总权重为0' }
      }
    }

    return {
      success: true,
      value: totalWeightedValue / totalWeight,
      details: { items: details, totalWeight }
    }
  }

  /**
   * 引用其他指标的计算结果
   */
  private async executeMetricReference(config: FormulaConfig): Promise<CalculationResult> {
    if (!config.metricCode) {
      return { success: false, error: '指标引用需要指定指标编码' }
    }

    // 从缓存或重新计算
    return this.calculateMetric(config.metricCode)
  }

  /**
   * 获取变量值 - 扩展支持所有24个数据源
   */
  private async getVariableValue(source: string, metric: string): Promise<number> {
    switch (source) {
      case 'employees':
        return this.getEmployeeMetric(metric)
      case 'energy':
        return this.getEnergyMetric(metric)
      case 'carbon':
        return this.getCarbonMetric(metric)
      case 'waste':
        return this.getWasteMetric(metric)
      case 'suppliers':
        return this.getSupplierMetric(metric)
      case 'training':
        return this.getTrainingMetric(metric)
      case 'safety':
        return this.getSafetyMetric(metric)
      case 'donations':
        return this.getDonationMetric(metric)
      // 新增数据源
      case 'water':
        return this.getWaterMetric(metric)
      case 'wasteWater':
        return this.getWasteWaterMetric(metric)
      case 'airEmission':
        return this.getAirEmissionMetric(metric)
      case 'material':
        return this.getMaterialMetric(metric)
      case 'noise':
        return this.getNoiseMetric(metric)
      case 'workTime':
        return this.getWorkTimeMetric(metric)
      case 'salary':
        return this.getSalaryMetric(metric)
      case 'board':
        return this.getBoardMetric(metric)
      case 'supervisors':
        return this.getSupervisorsMetric(metric)
      case 'executives':
        return this.getExecutivesMetric(metric)
      case 'shareholders':
        return this.getShareholdersMetric(metric)
      case 'rd':
        return this.getRdMetric(metric)
      case 'patents':
        return this.getPatentsMetric(metric)
      case 'productIncidents':
        return this.getProductIncidentsMetric(metric)
      case 'environmentInvestments':
        return this.getEnvironmentInvestmentsMetric(metric)
      case 'financials':
        return this.getFinancialsMetric(metric)
      case 'meetings':
        return this.getMeetingsMetric(metric)
      case 'certifications':
        return this.getCertificationsMetric(metric)
      default:
        return 0
    }
  }

  /**
   * 员工相关指标
   */
  private async getEmployeeMetric(metric: string): Promise<number> {
    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(employees)
          .where(eq(employees.status, 'active'))
        return totalResult[0]?.count || 0
      case 'female':
        const femaleResult = await db.select({ count: count() }).from(employees)
          .where(and(eq(employees.status, 'active'), eq(employees.gender, 'female')))
        return femaleResult[0]?.count || 0
      case 'male':
        const maleResult = await db.select({ count: count() }).from(employees)
          .where(and(eq(employees.status, 'active'), eq(employees.gender, 'male')))
        return maleResult[0]?.count || 0
      case 'partyMembers':
        const partyResult = await db.select({ count: count() }).from(employees)
          .where(and(eq(employees.status, 'active'), eq(employees.isPartyMember, true)))
        return partyResult[0]?.count || 0
      case 'unionMembers':
        const unionResult = await db.select({ count: count() }).from(employees)
          .where(and(eq(employees.status, 'active'), eq(employees.isUnionMember, true)))
        return unionResult[0]?.count || 0
      case 'disabled':
        const disabledResult = await db.select({ count: count() }).from(employees)
          .where(and(eq(employees.status, 'active'), eq(employees.isDisabled, true)))
        return disabledResult[0]?.count || 0
      case 'minority':
        const minorityResult = await db.select({ count: count() }).from(employees)
          .where(and(eq(employees.status, 'active'), eq(employees.isMinority, true)))
        return minorityResult[0]?.count || 0
      default:
        return 0
    }
  }

  /**
   * 能源相关指标
   */
  private async getEnergyMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(energyConsumption.period, this.period) : undefined

    switch (metric) {
      case 'totalConsumption':
        const result = await db.select({ total: sum(energyConsumption.consumption) })
          .from(energyConsumption)
          .where(filter)
        return Number(result[0]?.total) || 0
      case 'electricityConsumption':
        const elecResult = await db.select({ total: sum(energyConsumption.consumption) })
          .from(energyConsumption)
          .where(and(filter, eq(energyConsumption.energyType, 'electricity')))
        return Number(elecResult[0]?.total) || 0
      case 'renewableConsumption':
        const renewResult = await db.select({ total: sum(energyConsumption.consumption) })
          .from(energyConsumption)
          .where(and(filter, eq(energyConsumption.isRenewable, true)))
        return Number(renewResult[0]?.total) || 0
      case 'totalCost':
        const costResult = await db.select({ total: sum(energyConsumption.cost) })
          .from(energyConsumption)
          .where(filter)
        return Number(costResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 碳排放相关指标
   */
  private async getCarbonMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(carbonEmissions.period, this.period) : undefined

    switch (metric) {
      case 'totalEmission':
        const result = await db.select({ total: sum(carbonEmissions.emission) })
          .from(carbonEmissions)
          .where(filter)
        return Number(result[0]?.total) || 0
      case 'scope1':
        const scope1Result = await db.select({ total: sum(carbonEmissions.emission) })
          .from(carbonEmissions)
          .where(and(filter, eq(carbonEmissions.scope, 1)))
        return Number(scope1Result[0]?.total) || 0
      case 'scope2':
        const scope2Result = await db.select({ total: sum(carbonEmissions.emission) })
          .from(carbonEmissions)
          .where(and(filter, eq(carbonEmissions.scope, 2)))
        return Number(scope2Result[0]?.total) || 0
      case 'scope3':
        const scope3Result = await db.select({ total: sum(carbonEmissions.emission) })
          .from(carbonEmissions)
          .where(and(filter, eq(carbonEmissions.scope, 3)))
        return Number(scope3Result[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 废物相关指标
   */
  private async getWasteMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(wasteData.period, this.period) : undefined

    switch (metric) {
      case 'totalWaste':
        const result = await db.select({ total: sum(wasteData.quantity) })
          .from(wasteData)
          .where(filter)
        return Number(result[0]?.total) || 0
      case 'hazardousWaste':
        const hazardousResult = await db.select({ total: sum(wasteData.quantity) })
          .from(wasteData)
          .where(and(filter, eq(wasteData.wasteType, 'hazardous')))
        return Number(hazardousResult[0]?.total) || 0
      case 'recycledWaste':
        const recycledResult = await db.select({ total: sum(wasteData.quantity) })
          .from(wasteData)
          .where(and(filter, eq(wasteData.disposalMethod, 'recycling')))
        return Number(recycledResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 供应商相关指标
   */
  private async getSupplierMetric(metric: string): Promise<number> {
    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(suppliers)
          .where(eq(suppliers.status, 'active'))
        return totalResult[0]?.count || 0
      case 'local':
        const localResult = await db.select({ count: count() }).from(suppliers)
          .where(and(eq(suppliers.status, 'active'), eq(suppliers.isLocal, true)))
        return localResult[0]?.count || 0
      case 'certified':
        const certifiedResult = await db.select({ count: count() }).from(suppliers)
          .where(and(eq(suppliers.status, 'active'), eq(suppliers.hasCertification, true)))
        return certifiedResult[0]?.count || 0
      case 'totalContractAmount':
        const amountResult = await db.select({ total: sum(suppliers.contractAmount) }).from(suppliers)
          .where(eq(suppliers.status, 'active'))
        return Number(amountResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 培训相关指标
   */
  private async getTrainingMetric(metric: string): Promise<number> {
    const year = this.period?.substring(0, 4)
    const yearFilter = year ? sql`${trainingRecords.trainingDate} LIKE ${year + '%'}` : undefined

    switch (metric) {
      case 'totalHours':
        const hoursResult = await db.select({ total: sum(trainingRecords.duration) })
          .from(trainingRecords)
          .where(yearFilter)
        return Number(hoursResult[0]?.total) || 0
      case 'totalSessions':
        const sessionsResult = await db.select({ count: count() })
          .from(trainingRecords)
          .where(yearFilter)
        return sessionsResult[0]?.count || 0
      case 'totalCost':
        const costResult = await db.select({ total: sum(trainingRecords.cost) })
          .from(trainingRecords)
          .where(yearFilter)
        return Number(costResult[0]?.total) || 0
      case 'safetyTrainingHours':
        const safetyResult = await db.select({ total: sum(trainingRecords.duration) })
          .from(trainingRecords)
          .where(and(yearFilter, eq(trainingRecords.trainingType, 'safety')))
        return Number(safetyResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 安全相关指标
   */
  private async getSafetyMetric(metric: string): Promise<number> {
    const year = this.period?.substring(0, 4)
    const yearFilter = year ? sql`${safetyIncidents.incidentDate} LIKE ${year + '%'}` : undefined

    switch (metric) {
      case 'totalIncidents':
        const incidentsResult = await db.select({ count: count() })
          .from(safetyIncidents)
          .where(yearFilter)
        return incidentsResult[0]?.count || 0
      case 'fatalIncidents':
        const fatalResult = await db.select({ count: count() })
          .from(safetyIncidents)
          .where(and(yearFilter, eq(safetyIncidents.severity, 'fatal')))
        return fatalResult[0]?.count || 0
      case 'lostDays':
        const lostDaysResult = await db.select({ total: sum(safetyIncidents.lostDays) })
          .from(safetyIncidents)
          .where(yearFilter)
        return Number(lostDaysResult[0]?.total) || 0
      case 'totalInjured':
        const injuredResult = await db.select({ total: sum(safetyIncidents.injuredCount) })
          .from(safetyIncidents)
          .where(yearFilter)
        return Number(injuredResult[0]?.total) || 0
      case 'totalFatalities':
        const fatalitiesResult = await db.select({ total: sum(safetyIncidents.fatalCount) })
          .from(safetyIncidents)
          .where(yearFilter)
        return Number(fatalitiesResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 公益捐赠相关指标
   */
  private async getDonationMetric(metric: string): Promise<number> {
    const year = this.period?.substring(0, 4)
    const yearFilter = year ? sql`${donations.donationDate} LIKE ${year + '%'}` : undefined

    switch (metric) {
      case 'totalAmount':
        const amountResult = await db.select({ total: sum(donations.amount) })
          .from(donations)
          .where(yearFilter)
        return Number(amountResult[0]?.total) || 0
      case 'volunteerHours':
        const hoursResult = await db.select({ total: sum(donations.volunteerHours) })
          .from(donations)
          .where(yearFilter)
        return Number(hoursResult[0]?.total) || 0
      case 'volunteerCount':
        const countResult = await db.select({ total: sum(donations.volunteerCount) })
          .from(donations)
          .where(yearFilter)
        return Number(countResult[0]?.total) || 0
      default:
        return 0
    }
  }

  // ========== 新增数据源指标方法 ==========

  /**
   * 水资源相关指标 (E3.1)
   */
  private async getWaterMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(waterConsumption.period, this.period) : undefined

    switch (metric) {
      case 'totalConsumption':
        const totalResult = await db.select({ total: sum(waterConsumption.consumption) })
          .from(waterConsumption)
          .where(filter)
        return Number(totalResult[0]?.total) || 0
      case 'recycledWater':
        const recycledResult = await db.select({ total: sum(waterConsumption.recycledAmount) })
          .from(waterConsumption)
          .where(filter)
        return Number(recycledResult[0]?.total) || 0
      case 'totalCost':
        const costResult = await db.select({ total: sum(waterConsumption.cost) })
          .from(waterConsumption)
          .where(filter)
        return Number(costResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 废水相关指标 (E2.1)
   */
  private async getWasteWaterMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(wasteWaterRecords.period, this.period) : undefined

    switch (metric) {
      case 'totalDischarge':
        const totalResult = await db.select({ total: sum(wasteWaterRecords.dischargeAmount) })
          .from(wasteWaterRecords)
          .where(filter)
        return Number(totalResult[0]?.total) || 0
      case 'codAmount':
        const codResult = await db.select({ total: sum(wasteWaterRecords.codAmount) })
          .from(wasteWaterRecords)
          .where(filter)
        return Number(codResult[0]?.total) || 0
      case 'ammoniaAmount':
        const ammoniaResult = await db.select({ total: sum(wasteWaterRecords.ammoniaAmount) })
          .from(wasteWaterRecords)
          .where(filter)
        return Number(ammoniaResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 废气相关指标 (E2.2)
   */
  private async getAirEmissionMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(airEmissionRecords.period, this.period) : undefined

    switch (metric) {
      case 'totalEmission':
        const totalResult = await db.select({ total: sum(airEmissionRecords.emissionAmount) })
          .from(airEmissionRecords)
          .where(filter)
        return Number(totalResult[0]?.total) || 0
      case 'so2Amount':
        const so2Result = await db.select({ total: sum(airEmissionRecords.emissionAmount) })
          .from(airEmissionRecords)
          .where(and(filter, eq(airEmissionRecords.pollutantType, 'SO2')))
        return Number(so2Result[0]?.total) || 0
      case 'noxAmount':
        const noxResult = await db.select({ total: sum(airEmissionRecords.emissionAmount) })
          .from(airEmissionRecords)
          .where(and(filter, eq(airEmissionRecords.pollutantType, 'NOx')))
        return Number(noxResult[0]?.total) || 0
      case 'particulateAmount':
        const particulateResult = await db.select({ total: sum(airEmissionRecords.emissionAmount) })
          .from(airEmissionRecords)
          .where(and(filter, like(airEmissionRecords.pollutantType, '%颗粒物%')))
        return Number(particulateResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 物料消耗相关指标 (E3.3)
   */
  private async getMaterialMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(materialConsumption.period, this.period) : undefined

    switch (metric) {
      case 'totalConsumption':
        const totalResult = await db.select({ total: sum(materialConsumption.consumption) })
          .from(materialConsumption)
          .where(filter)
        return Number(totalResult[0]?.total) || 0
      case 'recycledMaterial':
        const recycledResult = await db.select({ total: sum(materialConsumption.consumption) })
          .from(materialConsumption)
          .where(and(filter, eq(materialConsumption.isRecycled, true)))
        return Number(recycledResult[0]?.total) || 0
      case 'totalCost':
        const costResult = await db.select({ total: sum(materialConsumption.cost) })
          .from(materialConsumption)
          .where(filter)
        return Number(costResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 噪声相关指标 (E2.5)
   */
  private async getNoiseMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(noiseRecords.period, this.period) : undefined

    switch (metric) {
      case 'avgLevel':
        const avgResult = await db.select({ average: avg(noiseRecords.noiseLevel) })
          .from(noiseRecords)
          .where(filter)
        return Number(avgResult[0]?.average) || 0
      case 'maxLevel':
        const maxResult = await db.select({ max: sql`MAX(${noiseRecords.noiseLevel})` })
          .from(noiseRecords)
          .where(filter)
        return Number(maxResult[0]?.max) || 0
      case 'exceedCount':
        const exceedResult = await db.select({ count: count() })
          .from(noiseRecords)
          .where(and(filter, eq(noiseRecords.isExceedStandard, true)))
        return exceedResult[0]?.count || 0
      default:
        return 0
    }
  }

  /**
   * 工时相关指标 (S1.2.3)
   */
  private async getWorkTimeMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(employeeWorkTime.period, this.period) : undefined

    switch (metric) {
      case 'totalRegularHours':
        const regularResult = await db.select({ total: sum(employeeWorkTime.regularHours) })
          .from(employeeWorkTime)
          .where(filter)
        return Number(regularResult[0]?.total) || 0
      case 'totalOvertimeHours':
        const overtimeResult = await db.select({ total: sum(employeeWorkTime.overtimeHours) })
          .from(employeeWorkTime)
          .where(filter)
        return Number(overtimeResult[0]?.total) || 0
      case 'avgWorkHoursPerEmployee':
        const avgResult = await db.select({ average: avg(sql`${employeeWorkTime.regularHours} + ${employeeWorkTime.overtimeHours}`) })
          .from(employeeWorkTime)
          .where(filter)
        return Number(avgResult[0]?.average) || 0
      default:
        return 0
    }
  }

  /**
   * 薪酬相关指标 (S1.2.2)
   */
  private async getSalaryMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(salaryRecords.period, this.period) : undefined

    switch (metric) {
      case 'totalSalary':
        const totalResult = await db.select({ total: sum(salaryRecords.baseSalary) })
          .from(salaryRecords)
          .where(filter)
        return Number(totalResult[0]?.total) || 0
      case 'totalBonus':
        const bonusResult = await db.select({ total: sum(salaryRecords.bonus) })
          .from(salaryRecords)
          .where(filter)
        return Number(bonusResult[0]?.total) || 0
      case 'totalSocialInsurance':
        const insuranceResult = await db.select({ total: sum(salaryRecords.socialInsurance) })
          .from(salaryRecords)
          .where(filter)
        return Number(insuranceResult[0]?.total) || 0
      case 'avgSalary':
        const avgResult = await db.select({ average: avg(salaryRecords.baseSalary) })
          .from(salaryRecords)
          .where(filter)
        return Number(avgResult[0]?.average) || 0
      default:
        return 0
    }
  }

  /**
   * 董事会相关指标 (G1.2)
   */
  private async getBoardMetric(metric: string): Promise<number> {
    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(boardMembers)
          .where(eq(boardMembers.status, 'active'))
        return totalResult[0]?.count || 0
      case 'independent':
        const independentResult = await db.select({ count: count() }).from(boardMembers)
          .where(and(eq(boardMembers.status, 'active'), eq(boardMembers.isIndependent, true)))
        return independentResult[0]?.count || 0
      case 'female':
        const femaleResult = await db.select({ count: count() }).from(boardMembers)
          .where(and(eq(boardMembers.status, 'active'), eq(boardMembers.gender, 'female')))
        return femaleResult[0]?.count || 0
      case 'avgAge':
        const avgAgeResult = await db.select({ average: avg(boardMembers.age) }).from(boardMembers)
          .where(eq(boardMembers.status, 'active'))
        return Number(avgAgeResult[0]?.average) || 0
      default:
        return 0
    }
  }

  /**
   * 监事会相关指标 (G1.3)
   */
  private async getSupervisorsMetric(metric: string): Promise<number> {
    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(supervisors)
          .where(eq(supervisors.status, 'active'))
        return totalResult[0]?.count || 0
      case 'employeeRepresentative':
        const empRepResult = await db.select({ count: count() }).from(supervisors)
          .where(and(eq(supervisors.status, 'active'), eq(supervisors.isEmployeeRepresentative, true)))
        return empRepResult[0]?.count || 0
      case 'female':
        const femaleResult = await db.select({ count: count() }).from(supervisors)
          .where(and(eq(supervisors.status, 'active'), eq(supervisors.gender, 'female')))
        return femaleResult[0]?.count || 0
      default:
        return 0
    }
  }

  /**
   * 高管相关指标 (G1.4)
   */
  private async getExecutivesMetric(metric: string): Promise<number> {
    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(executives)
          .where(eq(executives.status, 'active'))
        return totalResult[0]?.count || 0
      case 'female':
        const femaleResult = await db.select({ count: count() }).from(executives)
          .where(and(eq(executives.status, 'active'), eq(executives.gender, 'female')))
        return femaleResult[0]?.count || 0
      case 'totalSalary':
        const salaryResult = await db.select({ total: sum(executives.annualSalary) }).from(executives)
          .where(eq(executives.status, 'active'))
        return Number(salaryResult[0]?.total) || 0
      case 'avgAge':
        const avgAgeResult = await db.select({ average: avg(executives.age) }).from(executives)
          .where(eq(executives.status, 'active'))
        return Number(avgAgeResult[0]?.average) || 0
      default:
        return 0
    }
  }

  /**
   * 股东相关指标 (G1.1)
   */
  private async getShareholdersMetric(metric: string): Promise<number> {
    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(shareholders)
        return totalResult[0]?.count || 0
      case 'institutional':
        const instResult = await db.select({ count: count() }).from(shareholders)
          .where(eq(shareholders.shareholderType, 'institutional'))
        return instResult[0]?.count || 0
      case 'topTenSharesRatio':
        const topTenResult = await db.select({ total: sum(shareholders.shareholdingRatio) })
          .from(shareholders)
          .where(sql`${shareholders.shareholdingRatio} >= (SELECT MIN(ratio) FROM (SELECT shareholding_ratio as ratio FROM shareholders ORDER BY shareholding_ratio DESC LIMIT 10))`)
        return Number(topTenResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 研发相关指标 (S2.2.3)
   */
  private async getRdMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(rdInvestment.period, this.period) : undefined

    switch (metric) {
      case 'totalInvestment':
        const totalResult = await db.select({ total: sum(rdInvestment.amount) })
          .from(rdInvestment)
          .where(filter)
        return Number(totalResult[0]?.total) || 0
      case 'personnelCount':
        const personnelResult = await db.select({ total: sum(rdInvestment.personnelCount) })
          .from(rdInvestment)
          .where(filter)
        return Number(personnelResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 专利相关指标 (S2.2.3)
   */
  private async getPatentsMetric(metric: string): Promise<number> {
    const year = this.period?.substring(0, 4)
    const yearFilter = year ? sql`${patents.applicationDate} LIKE ${year + '%'}` : undefined

    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(patents)
        return totalResult[0]?.count || 0
      case 'newApplications':
        const newAppResult = await db.select({ count: count() }).from(patents)
          .where(yearFilter)
        return newAppResult[0]?.count || 0
      case 'invention':
        const inventionResult = await db.select({ count: count() }).from(patents)
          .where(and(eq(patents.patentType, 'invention'), eq(patents.status, 'granted')))
        return inventionResult[0]?.count || 0
      case 'utility':
        const utilityResult = await db.select({ count: count() }).from(patents)
          .where(and(eq(patents.patentType, 'utility'), eq(patents.status, 'granted')))
        return utilityResult[0]?.count || 0
      default:
        return 0
    }
  }

  /**
   * 产品事件相关指标 (S2.2.2)
   */
  private async getProductIncidentsMetric(metric: string): Promise<number> {
    const year = this.period?.substring(0, 4)
    const yearFilter = year ? sql`${productIncidents.incidentDate} LIKE ${year + '%'}` : undefined

    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(productIncidents)
          .where(yearFilter)
        return totalResult[0]?.count || 0
      case 'recalls':
        const recallResult = await db.select({ count: count() }).from(productIncidents)
          .where(and(yearFilter, eq(productIncidents.incidentType, 'recall')))
        return recallResult[0]?.count || 0
      case 'complaints':
        const complaintResult = await db.select({ count: count() }).from(productIncidents)
          .where(and(yearFilter, eq(productIncidents.incidentType, 'complaint')))
        return complaintResult[0]?.count || 0
      default:
        return 0
    }
  }

  /**
   * 环保投资相关指标 (E4.2.1)
   */
  private async getEnvironmentInvestmentsMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(environmentInvestments.period, this.period) : undefined

    switch (metric) {
      case 'totalAmount':
        const totalResult = await db.select({ total: sum(environmentInvestments.amount) })
          .from(environmentInvestments)
          .where(filter)
        return Number(totalResult[0]?.total) || 0
      case 'emissionReduction':
        const emissionResult = await db.select({ total: sum(environmentInvestments.amount) })
          .from(environmentInvestments)
          .where(and(filter, eq(environmentInvestments.investmentType, 'emission_reduction')))
        return Number(emissionResult[0]?.total) || 0
      case 'energySaving':
        const energyResult = await db.select({ total: sum(environmentInvestments.amount) })
          .from(environmentInvestments)
          .where(and(filter, eq(environmentInvestments.investmentType, 'energy_saving')))
        return Number(energyResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 财务相关指标 (分母数据)
   */
  private async getFinancialsMetric(metric: string): Promise<number> {
    const filter = this.period ? eq(companyFinancials.period, this.period) : undefined

    switch (metric) {
      case 'revenue':
        const revenueResult = await db.select({ total: sum(companyFinancials.revenue) })
          .from(companyFinancials)
          .where(filter)
        return Number(revenueResult[0]?.total) || 0
      case 'totalAssets':
        const assetsResult = await db.select({ total: sum(companyFinancials.totalAssets) })
          .from(companyFinancials)
          .where(filter)
        return Number(assetsResult[0]?.total) || 0
      case 'netProfit':
        const profitResult = await db.select({ total: sum(companyFinancials.netProfit) })
          .from(companyFinancials)
          .where(filter)
        return Number(profitResult[0]?.total) || 0
      case 'operatingCost':
        const costResult = await db.select({ total: sum(companyFinancials.operatingCost) })
          .from(companyFinancials)
          .where(filter)
        return Number(costResult[0]?.total) || 0
      default:
        return 0
    }
  }

  /**
   * 会议相关指标 (G1)
   */
  private async getMeetingsMetric(metric: string): Promise<number> {
    const year = this.period?.substring(0, 4)
    const yearFilter = year ? sql`${meetingRecords.meetingDate} LIKE ${year + '%'}` : undefined

    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(meetingRecords)
          .where(yearFilter)
        return totalResult[0]?.count || 0
      case 'boardMeetings':
        const boardResult = await db.select({ count: count() }).from(meetingRecords)
          .where(and(yearFilter, eq(meetingRecords.meetingType, 'board')))
        return boardResult[0]?.count || 0
      case 'supervisorMeetings':
        const supervisorResult = await db.select({ count: count() }).from(meetingRecords)
          .where(and(yearFilter, eq(meetingRecords.meetingType, 'supervisor')))
        return supervisorResult[0]?.count || 0
      case 'shareholderMeetings':
        const shareholderResult = await db.select({ count: count() }).from(meetingRecords)
          .where(and(yearFilter, eq(meetingRecords.meetingType, 'shareholder')))
        return shareholderResult[0]?.count || 0
      default:
        return 0
    }
  }

  /**
   * 认证相关指标
   */
  private async getCertificationsMetric(metric: string): Promise<number> {
    switch (metric) {
      case 'total':
        const totalResult = await db.select({ count: count() }).from(certifications)
          .where(eq(certifications.status, 'active'))
        return totalResult[0]?.count || 0
      case 'iso14001':
        const isoEnvResult = await db.select({ count: count() }).from(certifications)
          .where(and(eq(certifications.status, 'active'), like(certifications.certificationName, '%ISO 14001%')))
        return isoEnvResult[0]?.count || 0
      case 'iso45001':
        const isoSafetyResult = await db.select({ count: count() }).from(certifications)
          .where(and(eq(certifications.status, 'active'), like(certifications.certificationName, '%ISO 45001%')))
        return isoSafetyResult[0]?.count || 0
      default:
        return 0
    }
  }

  /**
   * 获取数据表引用 - 扩展支持所有24个数据源
   */
  private getTable(dataSource: string) {
    const tables: Record<string, any> = {
      // 原有数据源
      employees,
      energy_consumption: energyConsumption,
      carbon_emissions: carbonEmissions,
      waste_data: wasteData,
      suppliers,
      training_records: trainingRecords,
      safety_incidents: safetyIncidents,
      donations,
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
    return tables[dataSource]
  }

  /**
   * 构建查询条件
   */
  private buildConditions(dataSource: string, filter?: Record<string, any>) {
    if (!filter) return undefined

    const table = this.getTable(dataSource)
    if (!table) return undefined

    const conditions: any[] = []

    for (const [key, value] of Object.entries(filter)) {
      const field = (table as any)[key]
      if (field) {
        conditions.push(eq(field, value))
      }
    }

    // 添加周期过滤
    if (this.period && (table as any).period) {
      conditions.push(eq((table as any).period, this.period))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  /**
   * 安全的数学表达式计算
   */
  private safeEval(expression: string): number {
    // 只允许数字和基本数学运算符
    const sanitized = expression.replace(/[^0-9+\-*/().]/g, '')
    if (sanitized !== expression.replace(/\s/g, '')) {
      throw new Error('表达式包含非法字符')
    }
    // 使用 Function 构造器代替 eval
    return new Function(`return ${sanitized}`)()
  }

  /**
   * 记录计算日志
   */
  private async logCalculation(metricCode: string, result: CalculationResult, executionTime: number) {
    try {
      const metric = await db.query.esgMetrics.findFirst({
        where: eq(esgMetrics.code, metricCode)
      })

      if (metric) {
        await db.insert(calculationLogs).values({
          metricId: metric.id,
          period: this.period,
          inputData: JSON.stringify(result.details),
          calculatedValue: typeof result.value === 'number' ? result.value : undefined,
          status: result.success ? 'success' : 'error',
          errorMessage: result.error,
          executionTime
        })
      }
    } catch (e) {
      console.error('记录计算日志失败:', e)
    }
  }
}

/**
 * 批量计算所有指标 - 支持依赖拓扑排序
 */
export async function calculateAllMetrics(period: string): Promise<Record<string, CalculationResult>> {
  const engine = new CalculationEngine(period)
  const results: Record<string, CalculationResult> = {}

  // 获取所有有计算公式的指标
  const formulas = await db.query.metricFormulas.findMany({
    where: eq(metricFormulas.isActive, true)
  })

  // 构建指标依赖图
  const metricDeps: Map<number, { metricCode: string; deps: string[] }> = new Map()
  for (const formula of formulas) {
    const metric = await db.query.esgMetrics.findFirst({
      where: eq(esgMetrics.id, formula.metricId)
    })
    if (metric) {
      const config = JSON.parse(formula.formula) as FormulaConfig
      const deps = extractDependencies(config)
      metricDeps.set(formula.metricId, { metricCode: metric.code, deps })
    }
  }

  // 拓扑排序
  const sortedMetrics = topologicalSort(metricDeps)

  // 按依赖顺序计算
  for (const metricCode of sortedMetrics) {
    const formula = formulas.find(f => {
      const m = [...metricDeps.entries()].find(([id, data]) => data.metricCode === metricCode)
      return m && f.metricId === m[0]
    })

    if (formula) {
      const config = JSON.parse(formula.formula) as FormulaConfig
      results[metricCode] = await engine.calculateMetric(metricCode, config)
    }
  }

  return results
}

/**
 * 从公式配置中提取依赖的指标编码
 */
function extractDependencies(config: FormulaConfig): string[] {
  const deps: string[] = []

  if (config.type === 'metric' && config.metricCode) {
    deps.push(config.metricCode)
  }

  if (config.numerator) {
    deps.push(...extractDependencies(config.numerator))
  }
  if (config.denominator) {
    deps.push(...extractDependencies(config.denominator))
  }
  if (config.current) {
    deps.push(...extractDependencies(config.current))
  }
  if (config.previous) {
    deps.push(...extractDependencies(config.previous))
  }
  if (config.weights) {
    for (const w of config.weights) {
      deps.push(...extractDependencies(w.value))
      deps.push(...extractDependencies(w.weight))
    }
  }

  return [...new Set(deps)]
}

/**
 * 拓扑排序 - 确保依赖的指标先被计算
 */
function topologicalSort(metricDeps: Map<number, { metricCode: string; deps: string[] }>): string[] {
  const result: string[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  const codeToData = new Map<string, string[]>()
  for (const [_, data] of metricDeps) {
    codeToData.set(data.metricCode, data.deps)
  }

  function visit(code: string) {
    if (visited.has(code)) return
    if (visiting.has(code)) {
      console.warn(`检测到循环依赖: ${code}`)
      return
    }

    visiting.add(code)
    const deps = codeToData.get(code) || []
    for (const dep of deps) {
      visit(dep)
    }
    visiting.delete(code)
    visited.add(code)
    result.push(code)
  }

  for (const [_, data] of metricDeps) {
    visit(data.metricCode)
  }

  return result
}

/**
 * 按模块计算指标
 */
export async function calculateModuleMetrics(period: string, moduleCode: string): Promise<Record<string, CalculationResult>> {
  const engine = new CalculationEngine(period)
  const results: Record<string, CalculationResult> = {}

  // 获取该模块下的所有指标
  const metrics = await db.query.esgMetrics.findMany({
    where: sql`${esgMetrics.code} LIKE ${moduleCode + '%'}`
  })

  for (const metric of metrics) {
    const formula = await db.query.metricFormulas.findFirst({
      where: and(
        eq(metricFormulas.metricId, metric.id),
        eq(metricFormulas.isActive, true)
      )
    })

    if (formula) {
      const config = JSON.parse(formula.formula) as FormulaConfig
      results[metric.code] = await engine.calculateMetric(metric.code, config)
    }
  }

  return results
}

/**
 * 预定义的常用计算公式 - 扩展版
 */
export const PREDEFINED_FORMULAS = {
  // ========== 环境指标 (E) ==========

  // E1.1 温室气体排放总量
  totalGhgEmission: {
    type: 'sum' as const,
    dataSource: 'carbon_emissions',
    field: 'emission'
  },

  // E1.1.1 范围1排放
  scope1Emission: {
    type: 'sum' as const,
    dataSource: 'carbon_emissions',
    field: 'emission',
    filter: { scope: 1 }
  },

  // E1.1.2 范围2排放
  scope2Emission: {
    type: 'sum' as const,
    dataSource: 'carbon_emissions',
    field: 'emission',
    filter: { scope: 2 }
  },

  // E1.2 碳排放强度 (单位营收)
  carbonIntensityPerRevenue: {
    type: 'ratio' as const,
    numerator: { type: 'sum' as const, dataSource: 'carbon_emissions', field: 'emission' },
    denominator: { type: 'sum' as const, dataSource: 'company_financials', field: 'revenue' },
    multiply: 10000 // 每万元营收
  },

  // E2.1.1 废水排放总量
  totalWasteWater: {
    type: 'sum' as const,
    dataSource: 'waste_water_records',
    field: 'dischargeAmount'
  },

  // E2.2.1 废气排放总量
  totalAirEmission: {
    type: 'sum' as const,
    dataSource: 'air_emission_records',
    field: 'emissionAmount'
  },

  // E2.3.1 固体废物产生量
  totalSolidWaste: {
    type: 'sum' as const,
    dataSource: 'waste_data',
    field: 'quantity'
  },

  // E2.3.2 危险废物比例
  hazardousWasteRatio: {
    type: 'percentage' as const,
    numerator: { type: 'sum' as const, dataSource: 'waste_data', field: 'quantity', filter: { wasteType: 'hazardous' } },
    denominator: { type: 'sum' as const, dataSource: 'waste_data', field: 'quantity' }
  },

  // E2.3.3 废物回收率
  wasteRecyclingRate: {
    type: 'percentage' as const,
    dataSource: 'waste_data',
    numerator: { type: 'sum' as const, dataSource: 'waste_data', field: 'quantity', filter: { disposalMethod: 'recycling' } },
    denominator: { type: 'sum' as const, dataSource: 'waste_data', field: 'quantity' }
  },

  // E3.1.1 总用水量
  totalWaterConsumption: {
    type: 'sum' as const,
    dataSource: 'water_consumption',
    field: 'consumption'
  },

  // E3.1.2 水回用率
  waterRecyclingRate: {
    type: 'percentage' as const,
    numerator: { type: 'sum' as const, dataSource: 'water_consumption', field: 'recycledAmount' },
    denominator: { type: 'sum' as const, dataSource: 'water_consumption', field: 'consumption' }
  },

  // E3.2.1 总能源消耗
  totalEnergyConsumption: {
    type: 'sum' as const,
    dataSource: 'energy_consumption',
    field: 'consumption'
  },

  // E3.2.2 可再生能源比例
  renewableEnergyRatio: {
    type: 'percentage' as const,
    dataSource: 'energy_consumption',
    numerator: { type: 'sum' as const, dataSource: 'energy_consumption', field: 'consumption', filter: { isRenewable: true } },
    denominator: { type: 'sum' as const, dataSource: 'energy_consumption', field: 'consumption' }
  },

  // E4.2.1 环保投资总额
  totalEnvironmentInvestment: {
    type: 'sum' as const,
    dataSource: 'environment_investments',
    field: 'amount'
  },

  // E4.2.2 环保投资占比
  environmentInvestmentRatio: {
    type: 'percentage' as const,
    numerator: { type: 'sum' as const, dataSource: 'environment_investments', field: 'amount' },
    denominator: { type: 'sum' as const, dataSource: 'company_financials', field: 'revenue' }
  },

  // ========== 社会指标 (S) ==========

  // S1.1.1 员工总数
  totalEmployees: {
    type: 'count' as const,
    dataSource: 'employees',
    filter: { status: 'active' }
  },

  // S1.1.2 女性员工比例
  femaleRatio: {
    type: 'percentage' as const,
    dataSource: 'employees',
    numerator: { type: 'count' as const, dataSource: 'employees', filter: { gender: 'female', status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'employees', filter: { status: 'active' } }
  },

  // S1.1.3 少数民族员工比例
  minorityRatio: {
    type: 'percentage' as const,
    dataSource: 'employees',
    numerator: { type: 'count' as const, dataSource: 'employees', filter: { isMinority: true, status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'employees', filter: { status: 'active' } }
  },

  // S1.1.4 残疾员工比例
  disabledRatio: {
    type: 'percentage' as const,
    dataSource: 'employees',
    numerator: { type: 'count' as const, dataSource: 'employees', filter: { isDisabled: true, status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'employees', filter: { status: 'active' } }
  },

  // S1.1.5 党员比例
  partyMemberRatio: {
    type: 'percentage' as const,
    dataSource: 'employees',
    numerator: { type: 'count' as const, dataSource: 'employees', filter: { isPartyMember: true, status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'employees', filter: { status: 'active' } }
  },

  // S1.2.1 人均培训时长
  trainingHoursPerEmployee: {
    type: 'ratio' as const,
    dataSource: 'training_records',
    numerator: { type: 'sum' as const, dataSource: 'training_records', field: 'duration' },
    denominator: { type: 'count' as const, dataSource: 'employees', filter: { status: 'active' } }
  },

  // S1.3.1 工伤事故数
  totalSafetyIncidents: {
    type: 'count' as const,
    dataSource: 'safety_incidents'
  },

  // S1.3.2 工亡人数
  totalFatalities: {
    type: 'sum' as const,
    dataSource: 'safety_incidents',
    field: 'fatalCount'
  },

  // S1.3.3 损失工时
  totalLostDays: {
    type: 'sum' as const,
    dataSource: 'safety_incidents',
    field: 'lostDays'
  },

  // S2.1.1 供应商总数
  totalSuppliers: {
    type: 'count' as const,
    dataSource: 'suppliers',
    filter: { status: 'active' }
  },

  // S2.1.2 本地供应商比例
  localSupplierRatio: {
    type: 'percentage' as const,
    dataSource: 'suppliers',
    numerator: { type: 'count' as const, dataSource: 'suppliers', filter: { isLocal: true, status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'suppliers', filter: { status: 'active' } }
  },

  // S2.2.3 研发投入
  totalRdInvestment: {
    type: 'sum' as const,
    dataSource: 'rd_investment',
    field: 'amount'
  },

  // S2.2.3 研发投入占比
  rdInvestmentRatio: {
    type: 'percentage' as const,
    numerator: { type: 'sum' as const, dataSource: 'rd_investment', field: 'amount' },
    denominator: { type: 'sum' as const, dataSource: 'company_financials', field: 'revenue' }
  },

  // S2.2.3 专利总数
  totalPatents: {
    type: 'count' as const,
    dataSource: 'patents',
    filter: { status: 'granted' }
  },

  // S3.1.1 公益捐赠总额
  totalDonations: {
    type: 'sum' as const,
    dataSource: 'donations',
    field: 'amount'
  },

  // S3.1.2 志愿服务时长
  totalVolunteerHours: {
    type: 'sum' as const,
    dataSource: 'donations',
    field: 'volunteerHours'
  },

  // ========== 治理指标 (G) ==========

  // G1.2.1 董事会人数
  totalBoardMembers: {
    type: 'count' as const,
    dataSource: 'board_members',
    filter: { status: 'active' }
  },

  // G1.2.2 独立董事比例
  independentDirectorRatio: {
    type: 'percentage' as const,
    numerator: { type: 'count' as const, dataSource: 'board_members', filter: { isIndependent: true, status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'board_members', filter: { status: 'active' } }
  },

  // G1.2.3 女性董事比例
  femaleBoardRatio: {
    type: 'percentage' as const,
    numerator: { type: 'count' as const, dataSource: 'board_members', filter: { gender: 'female', status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'board_members', filter: { status: 'active' } }
  },

  // G1.3.1 监事会人数
  totalSupervisors: {
    type: 'count' as const,
    dataSource: 'supervisors',
    filter: { status: 'active' }
  },

  // G1.3.2 职工监事比例
  employeeSupervisorRatio: {
    type: 'percentage' as const,
    numerator: { type: 'count' as const, dataSource: 'supervisors', filter: { isEmployeeRepresentative: true, status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'supervisors', filter: { status: 'active' } }
  },

  // G1.4.1 高管人数
  totalExecutives: {
    type: 'count' as const,
    dataSource: 'executives',
    filter: { status: 'active' }
  },

  // G1.4.2 女性高管比例
  femaleExecutiveRatio: {
    type: 'percentage' as const,
    numerator: { type: 'count' as const, dataSource: 'executives', filter: { gender: 'female', status: 'active' } },
    denominator: { type: 'count' as const, dataSource: 'executives', filter: { status: 'active' } }
  },

  // G1 董事会会议次数
  boardMeetingCount: {
    type: 'count' as const,
    dataSource: 'meeting_records',
    filter: { meetingType: 'board' }
  },

  // G1 监事会会议次数
  supervisorMeetingCount: {
    type: 'count' as const,
    dataSource: 'meeting_records',
    filter: { meetingType: 'supervisor' }
  },

  // G1 股东大会次数
  shareholderMeetingCount: {
    type: 'count' as const,
    dataSource: 'meeting_records',
    filter: { meetingType: 'shareholder' }
  }
}

/**
 * 导出公式配置类型供外部使用
 */
export type { FormulaConfig, CalculationResult }

export default CalculationEngine
