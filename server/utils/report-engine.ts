/**
 * ESG 报告生成引擎
 * 
 * 核心功能：
 * 1. 数据聚合 - 从 esgRecords 获取指定周期的指标数据
 * 2. 合规检查 - 调用 ComplianceEngine 检查数据完整性和合规性
 * 3. AI 内容生成 - 调用 LLM 生成章节叙述
 * 4. 报告组装 - 将各章节内容组装为完整报告
 * 5. 导出 - 支持 HTML/PDF/Word 格式导出
 */

import { db, esgReports, reportSections, esgRecords, esgMetrics, esgCategories, esgSubModules, esgModules, aiContentCache, reportGenerationTasks, complianceResults } from '../database'
import { eq, and, inArray, like, desc, sql } from 'drizzle-orm'
import { ComplianceEngine } from './compliance-engine'
import { LLMClient, type GenerateResult } from './llm-client'
import { SECTION_PROMPTS, getSectionPrompt, fillPromptTemplate, PROMPT_VERSION } from './prompts/report-prompts'
import crypto from 'crypto'

// 报告生成配置
export interface ReportGenerationConfig {
  reportId: number
  period: string
  templateId?: number
  companyName?: string
  language?: 'zh-CN' | 'en-US'
  includeSections?: string[]
  excludeMetrics?: string[]
  useAI?: boolean
  cacheAIContent?: boolean
}

// 章节数据
export interface SectionData {
  sectionCode: string
  title: string
  level: number
  sortOrder: number
  metricsData: MetricDataItem[]
  content?: string
  aiContent?: string
  chartsConfig?: any[]
}

// 指标数据项
export interface MetricDataItem {
  metricCode: string
  metricName: string
  categoryName: string
  subModuleName: string
  moduleName: string
  value: number | string | null
  unit?: string
  period: string
  status: string
  yoyChange?: number | null
  yoyChangePercent?: string | null
}

// 生成进度回调
export type ProgressCallback = (progress: number, step: string) => void

/**
 * 报告生成引擎类
 */
export class ReportEngine {
  private config: ReportGenerationConfig
  private llmClient: LLMClient
  private complianceEngine: ComplianceEngine
  private progressCallback?: ProgressCallback

  constructor(config: ReportGenerationConfig) {
    this.config = {
      language: 'zh-CN',
      useAI: true,
      cacheAIContent: true,
      ...config
    }
    this.llmClient = new LLMClient()
    this.complianceEngine = new ComplianceEngine(config.period)
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback: ProgressCallback) {
    this.progressCallback = callback
  }

  /**
   * 更新进度
   */
  private updateProgress(progress: number, step: string) {
    this.progressCallback?.(progress, step)

    // 更新数据库中的进度
    db.update(esgReports)
      .set({ progress, updatedAt: new Date() })
      .where(eq(esgReports.id, this.config.reportId))
      .run()
  }

  /**
   * 生成完整报告
   */
  async generateReport(): Promise<void> {
    try {
      this.updateProgress(0, '开始生成报告')

      // 1. 更新报告状态为生成中
      await db.update(esgReports)
        .set({ status: 'generating', errorMessage: null })
        .where(eq(esgReports.id, this.config.reportId))

      // 2. 聚合数据
      this.updateProgress(10, '聚合 ESG 指标数据')
      const metricsData = await this.aggregateMetricsData()

      // 3. 执行合规检查
      this.updateProgress(20, '执行合规性检查')
      const complianceResult = await this.runComplianceCheck()

      // 4. 准备章节结构
      this.updateProgress(30, '准备报告章节结构')
      const sections = await this.prepareSections(metricsData)

      // 5. 生成各章节内容
      let currentProgress = 30
      const progressPerSection = 50 / sections.length

      for (const section of sections) {
        this.updateProgress(
          Math.round(currentProgress),
          `生成章节：${section.title}`
        )

        await this.generateSectionContent(section)
        currentProgress += progressPerSection
      }

      // 6. 组装完整报告
      this.updateProgress(85, '组装完整报告')
      const htmlContent = await this.assembleReport(sections)

      // 7. 保存报告
      this.updateProgress(95, '保存报告')
      await db.update(esgReports)
        .set({
          status: 'review',
          progress: 100,
          htmlContent,
          complianceSummary: JSON.stringify(complianceResult),
          updatedAt: new Date()
        })
        .where(eq(esgReports.id, this.config.reportId))

      this.updateProgress(100, '报告生成完成')

    } catch (error: any) {
      // 记录错误
      await db.update(esgReports)
        .set({
          status: 'draft',
          errorMessage: error.message,
          updatedAt: new Date()
        })
        .where(eq(esgReports.id, this.config.reportId))

      throw error
    }
  }

  /**
   * 聚合指标数据
   */
  async aggregateMetricsData(): Promise<Map<string, MetricDataItem[]>> {
    const result = new Map<string, MetricDataItem[]>()

    // 获取所有模块
    const modules = await db.query.esgModules.findMany({
      orderBy: [esgModules.sortOrder]
    })

    for (const module of modules) {
      const moduleData: MetricDataItem[] = []

      // 获取模块下的子模块
      const subModules = await db.query.esgSubModules.findMany({
        where: eq(esgSubModules.moduleId, module.id),
        orderBy: [esgSubModules.sortOrder]
      })

      for (const subModule of subModules) {
        // 获取子模块下的分类
        const categories = await db.query.esgCategories.findMany({
          where: eq(esgCategories.subModuleId, subModule.id)
        })

        const categoryIds = categories.map(c => c.id)
        if (categoryIds.length === 0) continue

        // 获取分类下的指标
        const metrics = await db.query.esgMetrics.findMany({
          where: and(
            inArray(esgMetrics.categoryId, categoryIds),
            eq(esgMetrics.enabled, true)
          )
        })

        const metricIds = metrics.map(m => m.id)
        if (metricIds.length === 0) continue

        // 获取当前周期的记录
        const records = await db.query.esgRecords.findMany({
          where: and(
            inArray(esgRecords.metricId, metricIds),
            eq(esgRecords.period, this.config.period)
          )
        })

        // 获取上一周期的记录（用于计算同比）
        const previousPeriod = this.getPreviousPeriod(this.config.period)
        const previousRecords = await db.query.esgRecords.findMany({
          where: and(
            inArray(esgRecords.metricId, metricIds),
            eq(esgRecords.period, previousPeriod)
          )
        })

        const previousRecordsMap = new Map(
          previousRecords.map(r => [r.metricId, r])
        )

        // 组装数据
        for (const metric of metrics) {
          const record = records.find(r => r.metricId === metric.id)
          const previousRecord = previousRecordsMap.get(metric.id)
          const category = categories.find(c => c.id === metric.categoryId)

          const value = record?.valueNumber ?? record?.valueText ?? null
          const previousValue = previousRecord?.valueNumber ?? null

          let yoyChange: number | null = null
          let yoyChangePercent: string | null = null

          if (typeof value === 'number' && typeof previousValue === 'number' && previousValue !== 0) {
            yoyChange = value - previousValue
            yoyChangePercent = ((yoyChange / previousValue) * 100).toFixed(2) + '%'
          }

          const fieldConfig = metric.fieldConfig ? JSON.parse(metric.fieldConfig) : {}

          moduleData.push({
            metricCode: metric.code,
            metricName: metric.name,
            categoryName: category?.name || '',
            subModuleName: subModule.name,
            moduleName: module.name,
            value,
            unit: fieldConfig.unit,
            period: this.config.period,
            status: record?.status || 'missing',
            yoyChange,
            yoyChangePercent
          })
        }
      }

      result.set(module.code, moduleData)
    }

    return result
  }

  /**
   * 执行合规检查
   */
  async runComplianceCheck() {
    const checkResult = await this.complianceEngine.batchCheck({
      triggerType: 'auto'
    })

    return {
      total: checkResult.total,
      passed: checkResult.passed,
      failed: checkResult.failed,
      warnings: checkResult.warnings,
      passRate: checkResult.total > 0
        ? ((checkResult.passed / checkResult.total) * 100).toFixed(1) + '%'
        : '0%',
      failedItems: checkResult.errors.slice(0, 10), // 取前10个严重问题
      warningItems: checkResult.warnings_list.slice(0, 10)
    }
  }

  /**
   * 准备章节结构
   */
  async prepareSections(metricsData: Map<string, MetricDataItem[]>): Promise<SectionData[]> {
    const sections: SectionData[] = []
    let sortOrder = 0

    // 执行摘要
    sections.push({
      sectionCode: 'executive_summary',
      title: '执行摘要',
      level: 1,
      sortOrder: sortOrder++,
      metricsData: Array.from(metricsData.values()).flat()
    })

    // E/S/G 各模块
    const moduleOrder = ['E', 'S', 'G']
    const moduleNames: Record<string, string> = {
      E: '环境责任',
      S: '社会责任',
      G: '公司治理'
    }

    for (const moduleCode of moduleOrder) {
      const moduleData = metricsData.get(moduleCode) || []

      // 模块总览
      sections.push({
        sectionCode: moduleCode,
        title: moduleNames[moduleCode],
        level: 1,
        sortOrder: sortOrder++,
        metricsData: moduleData
      })

      // 获取子模块
      const subModuleCodes = [...new Set(moduleData.map(d => {
        const parts = d.metricCode.split('.')
        return parts[0] // E1, E2, S1 等
      }))]

      for (const subCode of subModuleCodes) {
        const subModuleData = moduleData.filter(d => d.metricCode.startsWith(subCode + '.'))
        const subModuleName = subModuleData[0]?.subModuleName || subCode

        sections.push({
          sectionCode: subCode,
          title: subModuleName,
          level: 2,
          sortOrder: sortOrder++,
          metricsData: subModuleData
        })
      }
    }

    // 数据洞察
    sections.push({
      sectionCode: 'data_insights',
      title: '数据洞察与分析',
      level: 1,
      sortOrder: sortOrder++,
      metricsData: Array.from(metricsData.values()).flat()
    })

    return sections
  }

  /**
   * 生成章节内容
   */
  async generateSectionContent(section: SectionData): Promise<void> {
    // 检查是否已有内容
    const existingSection = await db.query.reportSections.findFirst({
      where: and(
        eq(reportSections.reportId, this.config.reportId),
        eq(reportSections.sectionCode, section.sectionCode)
      )
    })

    // 如果已有人工编辑的内容，跳过 AI 生成
    if (existingSection?.isManuallyEdited && existingSection?.content) {
      section.content = existingSection.content
      return
    }

    // 获取 Prompt 模板
    const promptConfig = getSectionPrompt(section.sectionCode)
    if (!promptConfig || !this.config.useAI) {
      // 无 AI 模板，使用数据表格作为内容
      section.content = this.generateDataTableContent(section)
      await this.saveSectionContent(section, false)
      return
    }

    // 检查 AI 缓存
    if (this.config.cacheAIContent) {
      const cached = await this.getAICache(section)
      if (cached) {
        section.content = cached
        section.aiContent = cached
        await this.saveSectionContent(section, true)
        return
      }
    }

    // 准备 Prompt 变量
    const variables = this.preparePromptVariables(section)
    const userPrompt = fillPromptTemplate(promptConfig.userPromptTemplate, variables)

    try {
      // 调用 LLM
      const result = await this.llmClient.generate([
        { role: 'system', content: promptConfig.systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        maxTokens: promptConfig.maxTokens
      })

      section.content = result.content
      section.aiContent = result.content

      // 保存缓存
      if (this.config.cacheAIContent) {
        await this.saveAICache(section, result)
      }

      // 保存章节
      await this.saveSectionContent(section, true, result.totalTokens)

    } catch (error: any) {
      console.error(`生成章节 ${section.sectionCode} 失败:`, error.message)
      // 降级使用数据表格
      section.content = this.generateDataTableContent(section)
      await this.saveSectionContent(section, false)
    }
  }

  /**
   * 准备 Prompt 变量
   */
  private preparePromptVariables(section: SectionData): Record<string, string> {
    const metricsTable = this.formatMetricsAsTable(section.metricsData)

    // 按模块分组数据
    const eData = section.metricsData.filter(d => d.metricCode.startsWith('E'))
    const sData = section.metricsData.filter(d => d.metricCode.startsWith('S'))
    const gData = section.metricsData.filter(d => d.metricCode.startsWith('G'))

    // 同比变化分析
    const yoyChanges = section.metricsData
      .filter(d => d.yoyChangePercent)
      .map(d => `- ${d.metricName}: ${d.value} ${d.unit || ''} (同比 ${d.yoyChangePercent})`)
      .join('\n')

    return {
      period: this.config.period,
      companyName: this.config.companyName || '本公司',
      metricsData: metricsTable,
      environmentData: this.formatMetricsAsTable(eData),
      socialData: this.formatMetricsAsTable(sData),
      governanceData: this.formatMetricsAsTable(gData),
      allMetricsData: metricsTable,
      yoyAnalysis: yoyChanges || '暂无同比数据',
      yoyChanges: yoyChanges || '暂无同比数据',
      complianceSummary: '详见合规检查报告',
      complianceResults: '详见合规检查报告',
      complianceStatus: '合规达标',
      historicalTrend: '详见历史数据分析',
      employeeStats: this.formatMetricsAsTable(sData.filter(d => d.metricCode.startsWith('S1'))),
      supplierStats: this.formatMetricsAsTable(sData.filter(d => d.metricCode.startsWith('S2'))),
      boardStats: this.formatMetricsAsTable(gData.filter(d => d.metricCode.startsWith('G1'))),
      initiatives: '详见具体措施说明',
      charityActivities: '详见公益活动记录',
      governanceStructure: '详见治理结构说明',
      complianceRiskData: this.formatMetricsAsTable(gData.filter(d => d.metricCode.startsWith('G2'))),
      complianceEvents: '详见合规事件记录',
      failedItems: '详见合规检查报告',
      warningItems: '详见合规检查报告',
      missingMetrics: '详见数据完整性报告'
    }
  }

  /**
   * 格式化指标数据为表格
   */
  private formatMetricsAsTable(data: MetricDataItem[]): string {
    if (data.length === 0) return '暂无数据'

    const lines = ['| 指标 | 数值 | 单位 | 同比变化 |', '|------|------|------|----------|']

    for (const item of data.slice(0, 50)) { // 限制数量避免 Token 过长
      const value = item.value ?? '-'
      const unit = item.unit || '-'
      const yoy = item.yoyChangePercent || '-'
      lines.push(`| ${item.metricName} | ${value} | ${unit} | ${yoy} |`)
    }

    if (data.length > 50) {
      lines.push(`\n*（共 ${data.length} 项指标，此处显示前 50 项）*`)
    }

    return lines.join('\n')
  }

  /**
   * 生成数据表格内容（无 AI 时使用）
   */
  private generateDataTableContent(section: SectionData): string {
    return `## ${section.title}\n\n${this.formatMetricsAsTable(section.metricsData)}`
  }

  /**
   * 保存章节内容
   */
  private async saveSectionContent(
    section: SectionData,
    isAiGenerated: boolean,
    tokensUsed?: number
  ): Promise<void> {
    const existing = await db.query.reportSections.findFirst({
      where: and(
        eq(reportSections.reportId, this.config.reportId),
        eq(reportSections.sectionCode, section.sectionCode)
      )
    })

    const data = {
      reportId: this.config.reportId,
      sectionCode: section.sectionCode,
      title: section.title,
      level: section.level,
      sortOrder: section.sortOrder,
      content: section.content,
      aiGeneratedContent: section.aiContent,
      isAiGenerated,
      metricsData: JSON.stringify(section.metricsData.slice(0, 100)), // 限制存储数量
      chartsConfig: section.chartsConfig ? JSON.stringify(section.chartsConfig) : null,
      status: 'completed',
      tokensUsed: tokensUsed || 0,
      updatedAt: new Date()
    }

    if (existing) {
      await db.update(reportSections)
        .set(data)
        .where(eq(reportSections.id, existing.id))
    } else {
      await db.insert(reportSections).values(data as any)
    }
  }

  /**
   * 获取 AI 缓存
   */
  private async getAICache(section: SectionData): Promise<string | null> {
    const dataHash = this.computeDataHash(section.metricsData)
    const cacheKey = `${this.config.reportId}_${section.sectionCode}_${dataHash}`

    const cached = await db.query.aiContentCache.findFirst({
      where: and(
        eq(aiContentCache.cacheKey, cacheKey),
        eq(aiContentCache.promptVersion, PROMPT_VERSION)
      )
    })

    if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
      return cached.content
    }

    return null
  }

  /**
   * 保存 AI 缓存
   */
  private async saveAICache(section: SectionData, result: GenerateResult): Promise<void> {
    const dataHash = this.computeDataHash(section.metricsData)
    const cacheKey = `${this.config.reportId}_${section.sectionCode}_${dataHash}`

    // 缓存 7 天
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db.insert(aiContentCache)
      .values({
        cacheKey,
        reportId: this.config.reportId,
        sectionCode: section.sectionCode,
        dataHash,
        promptVersion: PROMPT_VERSION,
        content: result.content,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        expiresAt
      })
      .onConflictDoUpdate({
        target: aiContentCache.cacheKey,
        set: {
          content: result.content,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          expiresAt,
          createdAt: new Date()
        }
      })
  }

  /**
   * 计算数据哈希
   */
  private computeDataHash(data: MetricDataItem[]): string {
    const str = JSON.stringify(data.map(d => ({
      code: d.metricCode,
      value: d.value,
      period: d.period
    })))
    return crypto.createHash('md5').update(str).digest('hex').slice(0, 16)
  }

  /**
   * 组装完整报告
   */
  async assembleReport(sections: SectionData[]): Promise<string> {
    const report = await db.query.esgReports.findFirst({
      where: eq(esgReports.id, this.config.reportId)
    })

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report?.title || 'ESG 可持续发展报告'}</title>
  <style>
    :root {
      --primary-color: #059669;
      --text-color: #1f2937;
      --border-color: #e5e7eb;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.8;
      color: var(--text-color);
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .cover {
      text-align: center;
      padding: 100px 20px;
      page-break-after: always;
    }
    .cover h1 {
      font-size: 2.5em;
      color: var(--primary-color);
      margin-bottom: 20px;
    }
    .cover .period {
      font-size: 1.5em;
      color: #6b7280;
    }
    .cover .company {
      font-size: 1.2em;
      margin-top: 40px;
    }
    .toc {
      page-break-after: always;
    }
    .toc h2 {
      color: var(--primary-color);
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 10px;
    }
    .toc ul {
      list-style: none;
      padding: 0;
    }
    .toc li {
      padding: 8px 0;
      border-bottom: 1px dotted var(--border-color);
    }
    .toc a {
      color: var(--text-color);
      text-decoration: none;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h1 {
      color: var(--primary-color);
      font-size: 1.8em;
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 10px;
      page-break-before: always;
    }
    .section h2 {
      color: var(--primary-color);
      font-size: 1.4em;
      margin-top: 30px;
    }
    .section h3 {
      font-size: 1.2em;
      margin-top: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid var(--border-color);
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .highlight {
      background: #ecfdf5;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid var(--primary-color);
      margin: 20px 0;
    }
    .warning {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      margin: 20px 0;
    }
    @media print {
      body { padding: 0; }
      .section h1 { page-break-before: always; }
    }
  </style>
</head>
<body>
  <!-- 封面 -->
  <div class="cover">
    <h1>${report?.title || 'ESG 可持续发展报告'}</h1>
    <p class="period">${this.config.period}</p>
    <p class="company">${this.config.companyName || ''}</p>
    <p style="margin-top: 60px; color: #9ca3af;">
      生成日期：${new Date().toLocaleDateString('zh-CN')}
    </p>
  </div>
  
  <!-- 目录 -->
  <div class="toc">
    <h2>目录</h2>
    <ul>
      ${sections.map((s, i) => `
        <li style="padding-left: ${(s.level - 1) * 20}px">
          <a href="#section-${i}">${s.title}</a>
        </li>
      `).join('')}
    </ul>
  </div>
  
  <!-- 正文 -->
  ${sections.map((s, i) => `
    <div class="section" id="section-${i}">
      <h${s.level}>${s.title}</h${s.level}>
      ${this.markdownToHtml(s.content || '')}
    </div>
  `).join('')}
  
  <!-- 页脚 -->
  <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid var(--border-color); text-align: center; color: #9ca3af;">
    <p>本报告由 ESG 可持续发展管理平台自动生成</p>
    <p>报告期间：${this.config.period} | 生成时间：${new Date().toLocaleString('zh-CN')}</p>
  </div>
</body>
</html>`

    return html
  }

  /**
   * 简单的 Markdown 转 HTML
   */
  private markdownToHtml(markdown: string): string {
    if (!markdown) return ''

    let html = markdown
      // 标题
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h4>$1</h4>')
      .replace(/^# (.*$)/gm, '<h5>$1</h5>')
      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 列表
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      // 表格
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim())
        if (cells.every(c => /^[-:]+$/.test(c.trim()))) {
          return '' // 分隔行
        }
        const isHeader = !html.includes('<tr>')
        const tag = isHeader ? 'th' : 'td'
        const row = cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')
        return `<tr>${row}</tr>`
      })
      // 包裹表格
      .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
      // 段落
      .replace(/\n\n/g, '</p><p>')
      // 换行
      .replace(/\n/g, '<br>')

    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>'
    }

    return html
  }

  /**
   * 获取上一周期
   */
  private getPreviousPeriod(period: string): string {
    if (period.includes('Q')) {
      // 季度: 2024-Q1 -> 2023-Q1
      const [year, quarter] = period.split('-Q')
      return `${parseInt(year) - 1}-Q${quarter}`
    } else if (period.includes('-')) {
      // 月度: 2024-01 -> 2023-01
      const [year, month] = period.split('-')
      return `${parseInt(year) - 1}-${month}`
    } else {
      // 年度: 2024 -> 2023
      return String(parseInt(period) - 1)
    }
  }

  /**
   * 单独生成某个章节的 AI 内容
   */
  async generateSectionAI(sectionCode: string, regenerate: boolean = false): Promise<{
    content: string
    tokensUsed: number
    fromCache: boolean
  }> {
    // 获取章节数据
    const section = await db.query.reportSections.findFirst({
      where: and(
        eq(reportSections.reportId, this.config.reportId),
        eq(reportSections.sectionCode, sectionCode)
      )
    })

    if (!section) {
      throw new Error(`章节 ${sectionCode} 不存在`)
    }

    // 聚合数据
    const metricsData = await this.aggregateMetricsData()
    const moduleCode = sectionCode.charAt(0)
    const sectionData: SectionData = {
      sectionCode,
      title: section.title,
      level: section.level || 1,
      sortOrder: section.sortOrder || 0,
      metricsData: metricsData.get(moduleCode) || Array.from(metricsData.values()).flat()
    }

    // 检查缓存
    if (!regenerate && this.config.cacheAIContent) {
      const cached = await this.getAICache(sectionData)
      if (cached) {
        return { content: cached, tokensUsed: 0, fromCache: true }
      }
    }

    // 生成内容
    const promptConfig = getSectionPrompt(sectionCode)
    if (!promptConfig) {
      throw new Error(`无法找到章节 ${sectionCode} 的 Prompt 模板`)
    }

    const variables = this.preparePromptVariables(sectionData)
    const userPrompt = fillPromptTemplate(promptConfig.userPromptTemplate, variables)

    const result = await this.llmClient.generate([
      { role: 'system', content: promptConfig.systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: promptConfig.maxTokens
    })

    // 保存缓存
    if (this.config.cacheAIContent) {
      await this.saveAICache(sectionData, result)
    }

    // 更新章节
    await db.update(reportSections)
      .set({
        aiGeneratedContent: result.content,
        isAiGenerated: true,
        tokensUsed: result.totalTokens,
        updatedAt: new Date()
      })
      .where(eq(reportSections.id, section.id))

    return {
      content: result.content,
      tokensUsed: result.totalTokens,
      fromCache: false
    }
  }
}

export default ReportEngine