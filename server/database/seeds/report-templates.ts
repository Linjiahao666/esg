/**
 * 报告模板种子数据
 * 
 * 运行: npx tsx server/database/seeds/report-templates.ts
 */

import { db, reportTemplates } from '../index'
import { eq } from 'drizzle-orm'

// 默认年度 ESG 报告模板
const annualReportTemplate = {
  code: 'annual_esg_report',
  name: '年度 ESG 报告',
  description: '适用于企业年度 ESG 可持续发展报告，包含完整的环境、社会、治理三大维度',
  type: 'annual',
  standards: JSON.stringify(['GRI', 'TCFD', 'SSE', 'SZSE']),
  isDefault: true,
  enabled: true,
  version: '1.0',
  config: JSON.stringify({
    sections: [
      { code: 'executive_summary', title: '执行摘要', level: 1 },
      { code: 'company_overview', title: '公司概况', level: 1 },
      { code: 'E', title: '环境责任', level: 1 },
      { code: 'E1', title: '碳排放与管理', level: 2 },
      { code: 'E2', title: '污染物排放及处理', level: 2 },
      { code: 'E3', title: '资源消耗与管理', level: 2 },
      { code: 'E4', title: '环境管理与环境保护', level: 2 },
      { code: 'S', title: '社会责任', level: 1 },
      { code: 'S1', title: '员工权益与发展', level: 2 },
      { code: 'S2', title: '供应链管理与负责任生产', level: 2 },
      { code: 'S3', title: '社会贡献与公益', level: 2 },
      { code: 'G', title: '公司治理', level: 1 },
      { code: 'G1', title: '治理结构', level: 2 },
      { code: 'G2', title: '治理机制', level: 2 },
      { code: 'data_insights', title: '数据洞察与分析', level: 1 },
      { code: 'appendix', title: '附录：指标数据明细', level: 1 }
    ],
    variables: {
      companyName: '公司名称',
      period: '报告期间',
      reportDate: '报告日期'
    },
    styles: {
      primaryColor: '#059669',
      fontFamily: 'system-ui, sans-serif'
    }
  }),
  coverConfig: JSON.stringify({
    showLogo: true,
    showTitle: true,
    showPeriod: true,
    showDate: true,
    backgroundColor: '#f0fdf4'
  })
}

// 季度 ESG 简报模板
const quarterlyReportTemplate = {
  code: 'quarterly_esg_brief',
  name: '季度 ESG 简报',
  description: '适用于季度 ESG 数据披露，聚焦关键指标变化',
  type: 'quarterly',
  standards: JSON.stringify(['SSE', 'SZSE']),
  isDefault: false,
  enabled: true,
  version: '1.0',
  config: JSON.stringify({
    sections: [
      { code: 'executive_summary', title: '季度摘要', level: 1 },
      { code: 'highlights', title: '本季度亮点', level: 1 },
      { code: 'E', title: '环境指标', level: 1 },
      { code: 'S', title: '社会指标', level: 1 },
      { code: 'G', title: '治理指标', level: 1 },
      { code: 'outlook', title: '下季度展望', level: 1 }
    ],
    variables: {
      companyName: '公司名称',
      period: '报告期间',
      quarter: '季度'
    }
  })
}

// GRI 标准披露模板
const griReportTemplate = {
  code: 'gri_disclosure',
  name: 'GRI 标准披露报告',
  description: '按照 GRI 2021 标准组织的可持续发展报告',
  type: 'compliance',
  standards: JSON.stringify(['GRI']),
  isDefault: false,
  enabled: true,
  version: '1.0',
  config: JSON.stringify({
    sections: [
      { code: 'gri_2_1', title: 'GRI 2: 一般披露', level: 1 },
      { code: 'gri_2_1_org', title: '2-1 组织详细信息', level: 2 },
      { code: 'gri_2_2', title: '2-2 纳入可持续发展报告的实体', level: 2 },
      { code: 'gri_2_3', title: '2-3 报告期间、频率和联系方式', level: 2 },
      { code: 'gri_3', title: 'GRI 3: 实质性议题', level: 1 },
      { code: 'gri_300', title: 'GRI 300: 环境议题', level: 1 },
      { code: 'gri_301', title: '301 物料', level: 2 },
      { code: 'gri_302', title: '302 能源', level: 2 },
      { code: 'gri_303', title: '303 水和废水', level: 2 },
      { code: 'gri_305', title: '305 排放', level: 2 },
      { code: 'gri_306', title: '306 废弃物', level: 2 },
      { code: 'gri_400', title: 'GRI 400: 社会议题', level: 1 },
      { code: 'gri_401', title: '401 雇佣', level: 2 },
      { code: 'gri_403', title: '403 职业健康与安全', level: 2 },
      { code: 'gri_404', title: '404 培训与教育', level: 2 },
      { code: 'gri_405', title: '405 多元化与平等机会', level: 2 }
    ]
  })
}

// TCFD 气候披露模板
const tcfdReportTemplate = {
  code: 'tcfd_disclosure',
  name: 'TCFD 气候相关披露',
  description: '按照 TCFD 框架的气候相关财务披露报告',
  type: 'compliance',
  standards: JSON.stringify(['TCFD']),
  isDefault: false,
  enabled: true,
  version: '1.0',
  config: JSON.stringify({
    sections: [
      { code: 'tcfd_governance', title: '治理', level: 1 },
      { code: 'tcfd_gov_a', title: '董事会对气候相关风险和机遇的监督', level: 2 },
      { code: 'tcfd_gov_b', title: '管理层在评估和管理气候相关风险和机遇中的作用', level: 2 },
      { code: 'tcfd_strategy', title: '战略', level: 1 },
      { code: 'tcfd_str_a', title: '组织识别的气候相关风险和机遇', level: 2 },
      { code: 'tcfd_str_b', title: '气候相关风险和机遇对业务、战略和财务规划的影响', level: 2 },
      { code: 'tcfd_str_c', title: '情景分析下组织战略的韧性', level: 2 },
      { code: 'tcfd_risk', title: '风险管理', level: 1 },
      { code: 'tcfd_risk_a', title: '识别和评估气候相关风险的流程', level: 2 },
      { code: 'tcfd_risk_b', title: '管理气候相关风险的流程', level: 2 },
      { code: 'tcfd_risk_c', title: '气候风险管理与整体风险管理的整合', level: 2 },
      { code: 'tcfd_metrics', title: '指标与目标', level: 1 },
      { code: 'tcfd_met_a', title: '评估气候相关风险和机遇使用的指标', level: 2 },
      { code: 'tcfd_met_b', title: '范围1、2、3温室气体排放及相关风险', level: 2 },
      { code: 'tcfd_met_c', title: '管理气候相关风险和机遇的目标及绩效', level: 2 }
    ]
  })
}

async function seedReportTemplates() {
  console.log('开始导入报告模板...')

  const templates = [
    annualReportTemplate,
    quarterlyReportTemplate,
    griReportTemplate,
    tcfdReportTemplate
  ]

  for (const template of templates) {
    // 检查是否已存在
    const existing = await db.query.reportTemplates.findFirst({
      where: eq(reportTemplates.code, template.code)
    })

    if (existing) {
      console.log(`模板 "${template.name}" 已存在，跳过`)
      continue
    }

    await db.insert(reportTemplates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`已导入模板: ${template.name}`)
  }

  console.log('报告模板导入完成!')
}

// 直接运行时执行
seedReportTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('导入报告模板失败:', error)
    process.exit(1)
  })