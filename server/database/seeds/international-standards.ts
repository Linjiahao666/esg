import { eq } from 'drizzle-orm'
import {
  esgStandards,
  standardTopics,
  standardMetrics,
  disclosureRequirements,
  type NewEsgStandard,
  type NewStandardTopic,
  type NewStandardMetric,
  type NewDisclosureRequirement
} from '../schema'

/**
 * 国际 ESG 标准种子数据
 * 包含：GRI、CSRD/ESRS(欧盟)、SEC Climate(美国)、上交所/深交所(中国)、ISSB
 */

// ============ 标准定义 ============
const STANDARDS: NewEsgStandard[] = [
  {
    code: 'GRI',
    name: 'GRI 可持续发展报告标准',
    nameEn: 'GRI Standards',
    issuer: 'Global Reporting Initiative',
    applicableRegions: JSON.stringify(['global']),
    standardType: 'framework',
    version: '2021',
    effectiveDate: '2023-01-01',
    status: 'active',
    description: 'GRI标准是全球最广泛采用的可持续发展报告标准，提供了组织报告其对经济、环境和社会影响的全球通用语言。',
    officialUrl: 'https://www.globalreporting.org/standards/',
    config: JSON.stringify({
      reportingPeriod: 'annual',
      assuranceRecommended: true,
      materiality: 'double_materiality'
    }),
    sortOrder: 1,
    enabled: true
  },
  {
    code: 'CSRD',
    name: '欧盟企业可持续发展报告指令',
    nameEn: 'Corporate Sustainability Reporting Directive',
    issuer: 'European Commission',
    applicableRegions: JSON.stringify(['EU', 'global']),
    standardType: 'regulation',
    version: 'ESRS 2023',
    effectiveDate: '2024-01-01',
    status: 'active',
    description: 'CSRD及其实施标准ESRS是欧盟强制性可持续发展报告法规，适用于在欧盟运营的大型企业和上市公司。',
    officialUrl: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en',
    config: JSON.stringify({
      reportingPeriod: 'annual',
      assuranceRequired: true,
      materiality: 'double_materiality',
      phaseIn: {
        '2024': 'large_public_interest_entities',
        '2025': 'large_companies',
        '2026': 'listed_smes'
      }
    }),
    sortOrder: 2,
    enabled: true
  },
  {
    code: 'SEC-CLIMATE',
    name: '美国证监会气候披露规则',
    nameEn: 'SEC Climate Disclosure Rules',
    issuer: 'U.S. Securities and Exchange Commission',
    applicableRegions: JSON.stringify(['US']),
    standardType: 'regulation',
    version: '2024',
    effectiveDate: '2024-03-06',
    status: 'active',
    description: '美国证监会气候相关披露规则要求上市公司披露气候相关风险、温室气体排放和气候目标。',
    officialUrl: 'https://www.sec.gov/rules/final/2024/33-11275.pdf',
    config: JSON.stringify({
      reportingPeriod: 'annual',
      assuranceRequired: true,
      scope: ['scope1', 'scope2'],
      scope3Threshold: 'material',
      phaseIn: {
        '2025': 'large_accelerated_filers',
        '2026': 'accelerated_filers',
        '2027': 'non_accelerated_filers'
      }
    }),
    sortOrder: 3,
    enabled: true
  },
  {
    code: 'SSE-ESG',
    name: '上海证券交易所ESG信息披露指引',
    nameEn: 'SSE ESG Disclosure Guidelines',
    issuer: '上海证券交易所',
    applicableRegions: JSON.stringify(['CN']),
    standardType: 'guideline',
    version: '2024',
    effectiveDate: '2024-05-01',
    status: 'active',
    description: '上交所ESG信息披露指引规范了上市公司ESG信息披露的内容、格式和发布要求，推动提升上市公司ESG信息披露质量。',
    officialUrl: 'http://www.sse.com.cn/',
    config: JSON.stringify({
      reportingPeriod: 'annual',
      disclosureType: 'comply_or_explain',
      applicableTo: ['sse_star_market', 'sse_main_board_selected']
    }),
    sortOrder: 4,
    enabled: true
  },
  {
    code: 'SZSE-ESG',
    name: '深圳证券交易所ESG信息披露指引',
    nameEn: 'SZSE ESG Disclosure Guidelines',
    issuer: '深圳证券交易所',
    applicableRegions: JSON.stringify(['CN']),
    standardType: 'guideline',
    version: '2024',
    effectiveDate: '2024-05-01',
    status: 'active',
    description: '深交所ESG信息披露指引为深市上市公司提供ESG信息披露的框架和要求。',
    officialUrl: 'http://www.szse.cn/',
    config: JSON.stringify({
      reportingPeriod: 'annual',
      disclosureType: 'comply_or_explain',
      applicableTo: ['szse_chinext', 'szse_main_board_selected']
    }),
    sortOrder: 5,
    enabled: true
  },
  {
    code: 'ISSB',
    name: 'ISSB可持续发展披露准则',
    nameEn: 'IFRS Sustainability Disclosure Standards',
    issuer: 'International Sustainability Standards Board',
    applicableRegions: JSON.stringify(['global']),
    standardType: 'framework',
    version: 'S1/S2 2023',
    effectiveDate: '2024-01-01',
    status: 'active',
    description: 'ISSB发布的IFRS S1和S2准则为全球资本市场提供了可持续发展披露的基线标准，重点关注企业价值相关的可持续发展信息。',
    officialUrl: 'https://www.ifrs.org/groups/international-sustainability-standards-board/',
    config: JSON.stringify({
      reportingPeriod: 'annual',
      materiality: 'financial_materiality',
      standards: ['IFRS_S1', 'IFRS_S2']
    }),
    sortOrder: 6,
    enabled: true
  },
  {
    code: 'TCFD',
    name: 'TCFD气候相关财务披露建议',
    nameEn: 'Task Force on Climate-related Financial Disclosures',
    issuer: 'Financial Stability Board',
    applicableRegions: JSON.stringify(['global']),
    standardType: 'framework',
    version: '2017/2021',
    effectiveDate: '2017-06-29',
    status: 'active',
    description: 'TCFD建议为组织提供了披露气候相关风险和机遇的框架，已被众多监管机构和标准采纳。',
    officialUrl: 'https://www.fsb-tcfd.org/',
    config: JSON.stringify({
      reportingPeriod: 'annual',
      pillars: ['governance', 'strategy', 'risk_management', 'metrics_targets']
    }),
    sortOrder: 7,
    enabled: true
  }
]

// ============ GRI 标准主题和指标 ============
const GRI_TOPICS: Omit<NewStandardTopic, 'standardId'>[] = [
  // 通用披露
  { code: 'GRI-2', name: '一般披露', nameEn: 'General Disclosures', dimension: 'general', topicType: 'topic', sortOrder: 1 },
  { code: 'GRI-3', name: '实质性议题', nameEn: 'Material Topics', dimension: 'general', topicType: 'topic', sortOrder: 2 },
  // 环境
  { code: 'GRI-301', name: '物料', nameEn: 'Materials', dimension: 'E', topicType: 'topic', sortOrder: 10 },
  { code: 'GRI-302', name: '能源', nameEn: 'Energy', dimension: 'E', topicType: 'topic', sortOrder: 11 },
  { code: 'GRI-303', name: '水与污水', nameEn: 'Water and Effluents', dimension: 'E', topicType: 'topic', sortOrder: 12 },
  { code: 'GRI-304', name: '生物多样性', nameEn: 'Biodiversity', dimension: 'E', topicType: 'topic', sortOrder: 13 },
  { code: 'GRI-305', name: '排放', nameEn: 'Emissions', dimension: 'E', topicType: 'topic', sortOrder: 14 },
  { code: 'GRI-306', name: '废弃物', nameEn: 'Waste', dimension: 'E', topicType: 'topic', sortOrder: 15 },
  // 社会
  { code: 'GRI-401', name: '雇佣', nameEn: 'Employment', dimension: 'S', topicType: 'topic', sortOrder: 20 },
  { code: 'GRI-403', name: '职业健康与安全', nameEn: 'Occupational Health and Safety', dimension: 'S', topicType: 'topic', sortOrder: 21 },
  { code: 'GRI-404', name: '培训与教育', nameEn: 'Training and Education', dimension: 'S', topicType: 'topic', sortOrder: 22 },
  { code: 'GRI-405', name: '多元化与平等机会', nameEn: 'Diversity and Equal Opportunity', dimension: 'S', topicType: 'topic', sortOrder: 23 },
  { code: 'GRI-413', name: '当地社区', nameEn: 'Local Communities', dimension: 'S', topicType: 'topic', sortOrder: 24 },
  // 治理
  { code: 'GRI-205', name: '反腐败', nameEn: 'Anti-corruption', dimension: 'G', topicType: 'topic', sortOrder: 30 },
  { code: 'GRI-206', name: '反竞争行为', nameEn: 'Anti-competitive Behavior', dimension: 'G', topicType: 'topic', sortOrder: 31 },
]

const GRI_METRICS: Omit<NewStandardMetric, 'standardId' | 'topicId'>[] = [
  // 能源 GRI 302
  { code: 'GRI 302-1', name: '组织内部能源消耗', nameEn: 'Energy consumption within the organization', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'GJ', frequency: 'annual', sortOrder: 1 },
  { code: 'GRI 302-2', name: '组织外部能源消耗', nameEn: 'Energy consumption outside of the organization', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'GJ', frequency: 'annual', sortOrder: 2 },
  { code: 'GRI 302-3', name: '能源强度', nameEn: 'Energy intensity', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'GJ/unit', frequency: 'annual', sortOrder: 3 },
  { code: 'GRI 302-4', name: '降低能源消耗', nameEn: 'Reduction of energy consumption', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'GJ', frequency: 'annual', sortOrder: 4 },
  
  // 排放 GRI 305
  { code: 'GRI 305-1', name: '直接温室气体排放（范围1）', nameEn: 'Direct GHG emissions (Scope 1)', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 10 },
  { code: 'GRI 305-2', name: '间接温室气体排放（范围2）', nameEn: 'Energy indirect GHG emissions (Scope 2)', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 11 },
  { code: 'GRI 305-3', name: '其他间接温室气体排放（范围3）', nameEn: 'Other indirect GHG emissions (Scope 3)', disclosureLevel: 'voluntary', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 12 },
  { code: 'GRI 305-4', name: '温室气体排放强度', nameEn: 'GHG emissions intensity', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e/unit', frequency: 'annual', sortOrder: 13 },
  { code: 'GRI 305-5', name: '温室气体减排量', nameEn: 'Reduction of GHG emissions', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 14 },
  
  // 水 GRI 303
  { code: 'GRI 303-3', name: '取水量', nameEn: 'Water withdrawal', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'ML', frequency: 'annual', sortOrder: 20 },
  { code: 'GRI 303-4', name: '排水量', nameEn: 'Water discharge', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'ML', frequency: 'annual', sortOrder: 21 },
  { code: 'GRI 303-5', name: '耗水量', nameEn: 'Water consumption', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'ML', frequency: 'annual', sortOrder: 22 },
  
  // 废弃物 GRI 306
  { code: 'GRI 306-3', name: '产生的废弃物', nameEn: 'Waste generated', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 30 },
  { code: 'GRI 306-4', name: '转移出处置的废弃物', nameEn: 'Waste diverted from disposal', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 31 },
  { code: 'GRI 306-5', name: '处置的废弃物', nameEn: 'Waste directed to disposal', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 32 },
  
  // 雇佣 GRI 401
  { code: 'GRI 401-1', name: '新进员工和员工流动', nameEn: 'New employee hires and employee turnover', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 40 },
  { code: 'GRI 401-2', name: '全职员工福利', nameEn: 'Benefits provided to full-time employees', disclosureLevel: 'mandatory', dataType: 'qualitative', frequency: 'annual', sortOrder: 41 },
  { code: 'GRI 401-3', name: '育婴假', nameEn: 'Parental leave', disclosureLevel: 'mandatory', dataType: 'both', frequency: 'annual', sortOrder: 42 },
  
  // 职业健康安全 GRI 403
  { code: 'GRI 403-9', name: '工伤', nameEn: 'Work-related injuries', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 50 },
  { code: 'GRI 403-10', name: '职业病', nameEn: 'Work-related ill health', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 51 },
  
  // 培训 GRI 404
  { code: 'GRI 404-1', name: '人均培训小时', nameEn: 'Average hours of training per year per employee', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'hours', frequency: 'annual', sortOrder: 60 },
  { code: 'GRI 404-3', name: '接受绩效和职业发展评估的员工比例', nameEn: 'Percentage of employees receiving performance reviews', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '%', frequency: 'annual', sortOrder: 61 },
  
  // 多元化 GRI 405
  { code: 'GRI 405-1', name: '治理机构和员工的多元化', nameEn: 'Diversity of governance bodies and employees', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 70 },
  { code: 'GRI 405-2', name: '女性与男性基本工资和报酬比率', nameEn: 'Ratio of basic salary and remuneration of women to men', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 71 },
]

// ============ CSRD/ESRS 标准主题和指标 ============
const CSRD_TOPICS: Omit<NewStandardTopic, 'standardId'>[] = [
  // 通用
  { code: 'ESRS-2', name: '一般披露', nameEn: 'General disclosures', dimension: 'general', topicType: 'topic', sortOrder: 1 },
  // 环境
  { code: 'ESRS-E1', name: '气候变化', nameEn: 'Climate change', dimension: 'E', topicType: 'topic', sortOrder: 10 },
  { code: 'ESRS-E2', name: '污染', nameEn: 'Pollution', dimension: 'E', topicType: 'topic', sortOrder: 11 },
  { code: 'ESRS-E3', name: '水和海洋资源', nameEn: 'Water and marine resources', dimension: 'E', topicType: 'topic', sortOrder: 12 },
  { code: 'ESRS-E4', name: '生物多样性与生态系统', nameEn: 'Biodiversity and ecosystems', dimension: 'E', topicType: 'topic', sortOrder: 13 },
  { code: 'ESRS-E5', name: '资源使用与循环经济', nameEn: 'Resource use and circular economy', dimension: 'E', topicType: 'topic', sortOrder: 14 },
  // 社会
  { code: 'ESRS-S1', name: '自有员工', nameEn: 'Own workforce', dimension: 'S', topicType: 'topic', sortOrder: 20 },
  { code: 'ESRS-S2', name: '价值链中的工人', nameEn: 'Workers in the value chain', dimension: 'S', topicType: 'topic', sortOrder: 21 },
  { code: 'ESRS-S3', name: '受影响的社区', nameEn: 'Affected communities', dimension: 'S', topicType: 'topic', sortOrder: 22 },
  { code: 'ESRS-S4', name: '消费者和最终用户', nameEn: 'Consumers and end-users', dimension: 'S', topicType: 'topic', sortOrder: 23 },
  // 治理
  { code: 'ESRS-G1', name: '商业行为', nameEn: 'Business conduct', dimension: 'G', topicType: 'topic', sortOrder: 30 },
]

const CSRD_METRICS: Omit<NewStandardMetric, 'standardId' | 'topicId'>[] = [
  // 气候变化 E1
  { code: 'ESRS E1-6', name: '范围1温室气体总排放量', nameEn: 'Gross Scope 1 GHG emissions', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 1 },
  { code: 'ESRS E1-6-L', name: '基于位置的范围2温室气体排放', nameEn: 'Location-based Scope 2 GHG emissions', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 2 },
  { code: 'ESRS E1-6-M', name: '基于市场的范围2温室气体排放', nameEn: 'Market-based Scope 2 GHG emissions', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 3 },
  { code: 'ESRS E1-6-S3', name: '范围3温室气体排放', nameEn: 'Scope 3 GHG emissions', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 4 },
  { code: 'ESRS E1-6-T', name: '温室气体总排放量', nameEn: 'Total GHG emissions', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 5 },
  { code: 'ESRS E1-7', name: '温室气体清除量', nameEn: 'GHG removals and storage', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 6 },
  { code: 'ESRS E1-5', name: '能源消耗和能源结构', nameEn: 'Energy consumption and mix', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'MWh', frequency: 'annual', sortOrder: 7 },
  
  // 污染 E2
  { code: 'ESRS E2-4', name: '空气污染物排放', nameEn: 'Pollution of air', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'kg', frequency: 'annual', sortOrder: 10 },
  { code: 'ESRS E2-4-W', name: '水污染物排放', nameEn: 'Pollution of water', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'kg', frequency: 'annual', sortOrder: 11 },
  { code: 'ESRS E2-4-S', name: '土壤污染物排放', nameEn: 'Pollution of soil', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'kg', frequency: 'annual', sortOrder: 12 },
  
  // 水资源 E3
  { code: 'ESRS E3-4', name: '取水量', nameEn: 'Water consumption', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'm3', frequency: 'annual', sortOrder: 20 },
  { code: 'ESRS E3-4-R', name: '循环利用水量', nameEn: 'Water recycled and reused', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'm3', frequency: 'annual', sortOrder: 21 },
  
  // 循环经济 E5
  { code: 'ESRS E5-4', name: '资源流入', nameEn: 'Resource inflows', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 30 },
  { code: 'ESRS E5-5', name: '资源流出', nameEn: 'Resource outflows', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 31 },
  
  // 自有员工 S1
  { code: 'ESRS S1-6', name: '员工特征', nameEn: 'Characteristics of employees', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 40 },
  { code: 'ESRS S1-9', name: '多元化指标', nameEn: 'Diversity metrics', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 41 },
  { code: 'ESRS S1-14', name: '健康安全指标', nameEn: 'Health and safety metrics', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 42 },
  { code: 'ESRS S1-16', name: '薪酬指标', nameEn: 'Remuneration metrics', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 43 },
  
  // 商业行为 G1
  { code: 'ESRS G1-4', name: '腐败和贿赂事件', nameEn: 'Confirmed incidents of corruption or bribery', disclosureLevel: 'mandatory', dataType: 'quantitative', frequency: 'annual', sortOrder: 50 },
]

// ============ 中国标准（上交所/深交所）主题和指标 ============
const CN_TOPICS: Omit<NewStandardTopic, 'standardId'>[] = [
  // 环境
  { code: 'CN-E1', name: '应对气候变化', nameEn: 'Climate Change', dimension: 'E', topicType: 'topic', sortOrder: 1 },
  { code: 'CN-E2', name: '污染防治与生态环保', nameEn: 'Pollution Prevention and Ecology', dimension: 'E', topicType: 'topic', sortOrder: 2 },
  { code: 'CN-E3', name: '资源利用', nameEn: 'Resource Utilization', dimension: 'E', topicType: 'topic', sortOrder: 3 },
  // 社会
  { code: 'CN-S1', name: '员工权益', nameEn: 'Employee Rights', dimension: 'S', topicType: 'topic', sortOrder: 10 },
  { code: 'CN-S2', name: '产品与客户', nameEn: 'Products and Customers', dimension: 'S', topicType: 'topic', sortOrder: 11 },
  { code: 'CN-S3', name: '供应链管理', nameEn: 'Supply Chain Management', dimension: 'S', topicType: 'topic', sortOrder: 12 },
  { code: 'CN-S4', name: '乡村振兴与社会公益', nameEn: 'Rural Revitalization and Social Welfare', dimension: 'S', topicType: 'topic', sortOrder: 13 },
  // 治理
  { code: 'CN-G1', name: '公司治理', nameEn: 'Corporate Governance', dimension: 'G', topicType: 'topic', sortOrder: 20 },
  { code: 'CN-G2', name: '商业道德', nameEn: 'Business Ethics', dimension: 'G', topicType: 'topic', sortOrder: 21 },
]

const CN_METRICS: Omit<NewStandardMetric, 'standardId' | 'topicId'>[] = [
  // 气候变化
  { code: 'CN-E1-1', name: '范围一温室气体排放量', nameEn: 'Scope 1 GHG Emissions', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 1 },
  { code: 'CN-E1-2', name: '范围二温室气体排放量', nameEn: 'Scope 2 GHG Emissions', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e', frequency: 'annual', sortOrder: 2 },
  { code: 'CN-E1-3', name: '温室气体排放强度', nameEn: 'GHG Emissions Intensity', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tCO2e/万元', frequency: 'annual', sortOrder: 3 },
  { code: 'CN-E1-4', name: '碳减排目标及进展', nameEn: 'Carbon Reduction Targets and Progress', disclosureLevel: 'comply_or_explain', dataType: 'qualitative', frequency: 'annual', sortOrder: 4 },
  
  // 能源与资源
  { code: 'CN-E3-1', name: '综合能源消耗量', nameEn: 'Total Energy Consumption', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tce', frequency: 'annual', sortOrder: 10 },
  { code: 'CN-E3-2', name: '综合能源消耗强度', nameEn: 'Energy Consumption Intensity', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'tce/万元', frequency: 'annual', sortOrder: 11 },
  { code: 'CN-E3-3', name: '新鲜水消耗量', nameEn: 'Fresh Water Consumption', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'm3', frequency: 'annual', sortOrder: 12 },
  { code: 'CN-E3-4', name: '包装材料使用量', nameEn: 'Packaging Material Usage', disclosureLevel: 'comply_or_explain', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 13 },
  
  // 污染
  { code: 'CN-E2-1', name: '废水排放量', nameEn: 'Wastewater Discharge', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 20 },
  { code: 'CN-E2-2', name: '危险废物产生量', nameEn: 'Hazardous Waste Generated', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 21 },
  { code: 'CN-E2-3', name: '一般固体废物产生量', nameEn: 'Non-hazardous Waste Generated', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 't', frequency: 'annual', sortOrder: 22 },
  
  // 员工
  { code: 'CN-S1-1', name: '员工总数', nameEn: 'Total Number of Employees', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '人', frequency: 'annual', sortOrder: 30 },
  { code: 'CN-S1-2', name: '女性员工占比', nameEn: 'Percentage of Female Employees', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '%', frequency: 'annual', sortOrder: 31 },
  { code: 'CN-S1-3', name: '员工培训投入', nameEn: 'Employee Training Investment', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '万元', frequency: 'annual', sortOrder: 32 },
  { code: 'CN-S1-4', name: '人均培训时长', nameEn: 'Training Hours per Employee', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: 'hours', frequency: 'annual', sortOrder: 33 },
  { code: 'CN-S1-5', name: '工伤事故数', nameEn: 'Work-related Injuries', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '起', frequency: 'annual', sortOrder: 34 },
  { code: 'CN-S1-6', name: '劳动合同签订率', nameEn: 'Labor Contract Coverage', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '%', frequency: 'annual', sortOrder: 35 },
  { code: 'CN-S1-7', name: '社保覆盖率', nameEn: 'Social Insurance Coverage', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '%', frequency: 'annual', sortOrder: 36 },
  
  // 供应链
  { code: 'CN-S3-1', name: '供应商总数', nameEn: 'Total Number of Suppliers', disclosureLevel: 'comply_or_explain', dataType: 'quantitative', unit: '家', frequency: 'annual', sortOrder: 40 },
  { code: 'CN-S3-2', name: '通过ESG审核的供应商占比', nameEn: 'Suppliers Passing ESG Audit', disclosureLevel: 'comply_or_explain', dataType: 'quantitative', unit: '%', frequency: 'annual', sortOrder: 41 },
  
  // 公益
  { code: 'CN-S4-1', name: '社会公益投入', nameEn: 'Social Welfare Investment', disclosureLevel: 'comply_or_explain', dataType: 'quantitative', unit: '万元', frequency: 'annual', sortOrder: 50 },
  { code: 'CN-S4-2', name: '志愿服务时长', nameEn: 'Volunteer Service Hours', disclosureLevel: 'voluntary', dataType: 'quantitative', unit: 'hours', frequency: 'annual', sortOrder: 51 },
  
  // 治理
  { code: 'CN-G1-1', name: '独立董事占比', nameEn: 'Independent Directors Ratio', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '%', frequency: 'annual', sortOrder: 60 },
  { code: 'CN-G1-2', name: '董事会女性占比', nameEn: 'Female Directors Ratio', disclosureLevel: 'mandatory', dataType: 'quantitative', unit: '%', frequency: 'annual', sortOrder: 61 },
  { code: 'CN-G2-1', name: '反腐败培训覆盖率', nameEn: 'Anti-corruption Training Coverage', disclosureLevel: 'comply_or_explain', dataType: 'quantitative', unit: '%', frequency: 'annual', sortOrder: 70 },
]

// ============ 种子数据执行函数 ============
export async function seedInternationalStandards(db: any) {
  console.log('🌱 开始导入国际ESG标准数据...')
  
  try {
    // 1. 插入标准
    console.log('  📋 插入标准定义...')
    const insertedStandards = await db.insert(esgStandards).values(STANDARDS).returning()
    const standardMap = new Map(insertedStandards.map((s: any) => [s.code, s.id]))
    
    // 2. 插入 GRI 主题和指标
    const griId = standardMap.get('GRI')
    if (griId) {
      console.log('  📋 插入 GRI 标准主题和指标...')
      
      // 插入主题
      const griTopicsWithId = GRI_TOPICS.map(t => ({ ...t, standardId: griId }))
      const insertedGriTopics = await db.insert(standardTopics).values(griTopicsWithId).returning()
      const griTopicMap = new Map(insertedGriTopics.map((t: any) => [t.code, t.id]))
      
      // 插入指标（关联到对应主题）
      const griMetricsWithIds = GRI_METRICS.map(m => {
        const topicCode = m.code.split(' ')[1]?.split('-')[0] // 提取 302, 305 等
        const fullTopicCode = `GRI-${topicCode}`
        return {
          ...m,
          standardId: griId,
          topicId: griTopicMap.get(fullTopicCode) || null
        }
      })
      await db.insert(standardMetrics).values(griMetricsWithIds)
    }
    
    // 3. 插入 CSRD/ESRS 主题和指标
    const csrdId = standardMap.get('CSRD')
    if (csrdId) {
      console.log('  📋 插入 CSRD/ESRS 标准主题和指标...')
      
      const csrdTopicsWithId = CSRD_TOPICS.map(t => ({ ...t, standardId: csrdId }))
      const insertedCsrdTopics = await db.insert(standardTopics).values(csrdTopicsWithId).returning()
      const csrdTopicMap = new Map(insertedCsrdTopics.map((t: any) => [t.code, t.id]))
      
      const csrdMetricsWithIds = CSRD_METRICS.map(m => {
        const topicCode = m.code.split(' ')[1]?.split('-')[0] // 提取 E1, E2, S1, G1 等
        const fullTopicCode = `ESRS-${topicCode}`
        return {
          ...m,
          standardId: csrdId,
          topicId: csrdTopicMap.get(fullTopicCode) || null
        }
      })
      await db.insert(standardMetrics).values(csrdMetricsWithIds)
    }
    
    // 4. 插入中国标准主题和指标（上交所和深交所使用相同指标体系）
    const sseId = standardMap.get('SSE-ESG')
    const szseId = standardMap.get('SZSE-ESG')
    
    for (const cnId of [sseId, szseId]) {
      if (cnId) {
        const exchangeName = cnId === sseId ? 'SSE' : 'SZSE'
        console.log(`  📋 插入 ${exchangeName} 标准主题和指标...`)
        
        const cnTopicsWithId = CN_TOPICS.map(t => ({ ...t, standardId: cnId }))
        const insertedCnTopics = await db.insert(standardTopics).values(cnTopicsWithId).returning()
        const cnTopicMap = new Map(insertedCnTopics.map((t: any) => [t.code, t.id]))
        
        const cnMetricsWithIds = CN_METRICS.map(m => {
          const topicCode = m.code.split('-').slice(0, 2).join('-') // 提取 CN-E1, CN-S1 等
          return {
            ...m,
            standardId: cnId,
            topicId: cnTopicMap.get(topicCode) || null
          }
        })
        await db.insert(standardMetrics).values(cnMetricsWithIds)
      }
    }
    
    // 5. 为 ISSB, TCFD 添加基础主题（简化版本）
    const issbId = standardMap.get('ISSB')
    if (issbId) {
      console.log('  📋 插入 ISSB 标准主题...')
      await db.insert(standardTopics).values([
        { code: 'IFRS-S1', name: '可持续相关财务信息披露一般要求', nameEn: 'General Requirements', standardId: issbId, dimension: 'general', topicType: 'topic', sortOrder: 1 },
        { code: 'IFRS-S2', name: '气候相关披露', nameEn: 'Climate-related Disclosures', standardId: issbId, dimension: 'E', topicType: 'topic', sortOrder: 2 },
      ])
    }
    
    const tcfdId = standardMap.get('TCFD')
    if (tcfdId) {
      console.log('  📋 插入 TCFD 标准主题...')
      await db.insert(standardTopics).values([
        { code: 'TCFD-GOV', name: '治理', nameEn: 'Governance', standardId: tcfdId, dimension: 'G', topicType: 'topic', sortOrder: 1 },
        { code: 'TCFD-STR', name: '战略', nameEn: 'Strategy', standardId: tcfdId, dimension: 'general', topicType: 'topic', sortOrder: 2 },
        { code: 'TCFD-RISK', name: '风险管理', nameEn: 'Risk Management', standardId: tcfdId, dimension: 'G', topicType: 'topic', sortOrder: 3 },
        { code: 'TCFD-MET', name: '指标和目标', nameEn: 'Metrics and Targets', standardId: tcfdId, dimension: 'E', topicType: 'topic', sortOrder: 4 },
      ])
    }
    
    console.log('✅ 国际ESG标准数据导入完成!')
    console.log(`   - 共导入 ${insertedStandards.length} 个标准`)
    
    return { success: true, standardsCount: insertedStandards.length }
  } catch (error) {
    console.error('❌ 导入国际ESG标准数据失败:', error)
    throw error
  }
}
