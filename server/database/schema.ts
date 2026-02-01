import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// 角色常量定义
export const ROLES = {
  ADMIN: 'admin',     // 管理员 - 完全控制权限
  AUDITOR: 'auditor', // 审计者 - 审核数据、查看报告
  ENTRY: 'entry',     // 录入者 - 录入和提交数据
  VIEWER: 'viewer'    // 查看者 - 只读访问
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// 角色权限矩阵
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['view', 'create', 'edit', 'submit', 'approve', 'reject', 'export', 'calculate', 'manage_users'],
  [ROLES.AUDITOR]: ['view', 'approve', 'reject', 'export', 'calculate'],
  [ROLES.ENTRY]: ['view', 'create', 'edit', 'submit'],
  [ROLES.VIEWER]: ['view', 'export']
} as const

export type Permission = 'view' | 'create' | 'edit' | 'submit' | 'approve' | 'reject' | 'export' | 'calculate' | 'manage_users'

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role').default('viewer').notNull(), // admin, auditor, entry, viewer
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 会话表
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 文件上传记录表
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(),
  category: text('category').default('general'), // esg-report, document, image
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============ ESG 模块相关表 ============

// ESG 模块表 (E/S/G 三大类)
export const esgModules = sqliteTable('esg_modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(), // E, S, G
  name: text('name').notNull(), // 环境、社会、治理
  description: text('description'),
  icon: text('icon'), // 图标
  color: text('color'), // 主题色
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ESG 子模块表 (二级指标，如 E1 碳排放与管理)
export const esgSubModules = sqliteTable('esg_sub_modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  moduleId: integer('module_id')
    .notNull()
    .references(() => esgModules.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(), // E1, E2, S1, G1 等
  name: text('name').notNull(), // 碳排放与管理
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ESG 指标分类表 (三级/四级指标分组)
export const esgCategories = sqliteTable('esg_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subModuleId: integer('sub_module_id')
    .notNull()
    .references(() => esgSubModules.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'), // 支持多级分类
  code: text('code').notNull(), // E1.1, E1.1.1 等
  name: text('name').notNull(),
  level: integer('level').default(3), // 层级：3=三级, 4=四级
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ESG 指标定义表 (细分指标，如 E1.1.1.1 碳排放设施)
export const esgMetrics = sqliteTable('esg_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => esgCategories.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(), // E1.1.1.1
  name: text('name').notNull(), // 碳排放设施
  description: text('description'),
  // 字段类型: number(数值), text(文本), select(单选), multiselect(多选), date(日期), file(文件)
  fieldType: text('field_type').default('text').notNull(),
  // 字段配置 JSON: { unit: "吨", options: [], min, max, required, placeholder, tooltip }
  fieldConfig: text('field_config'), // JSON 字符串
  // 采集频率: yearly(年度), quarterly(季度), monthly(月度), once(一次性)
  frequency: text('frequency').default('yearly'),
  // 是否必填
  required: integer('required', { mode: 'boolean' }).default(false),
  // 排序
  sortOrder: integer('sort_order').default(0),
  // 是否启用
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ESG 指标数据记录表
export const esgRecords = sqliteTable('esg_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  metricId: integer('metric_id')
    .notNull()
    .references(() => esgMetrics.id, { onDelete: 'cascade' }),
  // 周期标识: 2024, 2024-Q1, 2024-01 等
  period: text('period').notNull(),
  // 组织单位ID (可选，用于多组织/多工厂场景)
  orgUnitId: integer('org_unit_id'),
  // 数值型数据
  valueNumber: real('value_number'),
  // 文本型数据
  valueText: text('value_text'),
  // JSON 数据 (用于复杂数据结构)
  valueJson: text('value_json'),
  // 数据状态: draft(草稿), submitted(已提交), approved(已审核), rejected(已退回)
  status: text('status').default('draft'),
  // 备注
  remark: text('remark'),
  // 提交人
  submittedBy: integer('submitted_by').references(() => users.id),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  // 审核人
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ESG 记录附件关联表
export const esgRecordFiles = sqliteTable('esg_record_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recordId: integer('record_id')
    .notNull()
    .references(() => esgRecords.id, { onDelete: 'cascade' }),
  fileId: integer('file_id')
    .notNull()
    .references(() => files.id, { onDelete: 'cascade' }),
  description: text('description'), // 附件说明
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 组织单位表 (可选，用于多组织管理)
export const orgUnits = sqliteTable('org_units', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  parentId: integer('parent_id'),
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: text('type'), // company, department, factory, project
  sortOrder: integer('sort_order').default(0),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============ 原始数据源表 ============

// 员工数据表 - 用于计算员工相关ESG指标
export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeNo: text('employee_no').notNull().unique(), // 工号
  name: text('name').notNull(),
  gender: text('gender'), // male, female, other
  birthDate: text('birth_date'), // 出生日期
  idCard: text('id_card'), // 身份证号(脱敏)
  phone: text('phone'),
  email: text('email'),
  department: text('department'), // 部门
  position: text('position'), // 职位
  level: text('level'), // 职级: junior, middle, senior, manager, director, executive
  employeeType: text('employee_type'), // 员工类型: fulltime, contract, intern, dispatch
  isPartyMember: integer('is_party_member', { mode: 'boolean' }).default(false), // 是否党员
  isUnionMember: integer('is_union_member', { mode: 'boolean' }).default(false), // 是否工会成员
  isDisabled: integer('is_disabled', { mode: 'boolean' }).default(false), // 是否残疾人
  isMinority: integer('is_minority', { mode: 'boolean' }).default(false), // 是否少数民族
  education: text('education'), // 学历: high_school, college, bachelor, master, phd
  hireDate: text('hire_date'), // 入职日期
  leaveDate: text('leave_date'), // 离职日期
  leaveReason: text('leave_reason'), // 离职原因
  status: text('status').default('active'), // active, resigned, retired
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 能源消耗数据表 - 用于计算环境相关ESG指标
export const energyConsumption = sqliteTable('energy_consumption', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(), // 周期: 2024-01, 2024-Q1, 2024
  energyType: text('energy_type').notNull(), // 能源类型: electricity, natural_gas, coal, gasoline, diesel, steam, water
  consumption: real('consumption').notNull(), // 消耗量
  unit: text('unit').notNull(), // 单位: kWh, m3, ton, liter
  cost: real('cost'), // 费用
  facility: text('facility'), // 设施/区域
  source: text('source'), // 来源: grid, solar, wind, self_generated
  isRenewable: integer('is_renewable', { mode: 'boolean' }).default(false), // 是否可再生能源
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 碳排放数据表 - 用于计算碳排放相关ESG指标
export const carbonEmissions = sqliteTable('carbon_emissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(),
  scope: integer('scope').notNull(), // 范围: 1, 2, 3
  category: text('category').notNull(), // 类别: stationary_combustion, mobile_combustion, process, electricity, business_travel 等
  source: text('source').notNull(), // 排放源描述
  activityData: real('activity_data'), // 活动数据量
  activityUnit: text('activity_unit'), // 活动数据单位
  emissionFactor: real('emission_factor'), // 排放因子
  emission: real('emission').notNull(), // 排放量 (tCO2e)
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 废弃物数据表 - 用于计算废物管理相关ESG指标
export const wasteData = sqliteTable('waste_data', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(),
  wasteType: text('waste_type').notNull(), // general, hazardous, recyclable, organic
  wasteName: text('waste_name').notNull(), // 废物名称
  quantity: real('quantity').notNull(), // 数量
  unit: text('unit').notNull(), // ton, kg, m3
  disposalMethod: text('disposal_method'), // 处置方式: landfill, incineration, recycling, reuse, treatment
  disposalVendor: text('disposal_vendor'), // 处置单位
  isCompliant: integer('is_compliant', { mode: 'boolean' }).default(true), // 是否合规处置
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 供应商数据表 - 用于计算供应链相关ESG指标
export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(), // 供应商编号
  name: text('name').notNull(),
  category: text('category'), // 类别: raw_material, equipment, service, logistics
  region: text('region'), // 地区
  country: text('country'), // 国家
  isLocal: integer('is_local', { mode: 'boolean' }).default(false), // 是否本地供应商
  contractAmount: real('contract_amount'), // 合同金额
  esgRating: text('esg_rating'), // ESG评级: A, B, C, D
  hasCertification: integer('has_certification', { mode: 'boolean' }).default(false), // 是否有ESG认证
  certifications: text('certifications'), // 认证列表 JSON
  auditDate: text('audit_date'), // 最近审核日期
  auditResult: text('audit_result'), // 审核结果
  status: text('status').default('active'), // active, suspended, terminated
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 培训记录表 - 用于计算培训相关ESG指标
export const trainingRecords = sqliteTable('training_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employees.id),
  trainingType: text('training_type').notNull(), // safety, environmental, compliance, skill, leadership, esg
  trainingName: text('training_name').notNull(),
  trainingDate: text('training_date').notNull(),
  duration: real('duration').notNull(), // 时长(小时)
  cost: real('cost'), // 费用
  provider: text('provider'), // 培训机构
  isOnline: integer('is_online', { mode: 'boolean' }).default(false),
  isPassed: integer('is_passed', { mode: 'boolean' }).default(true),
  certificate: text('certificate'), // 证书
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 安全事故记录表 - 用于计算安全相关ESG指标
export const safetyIncidents = sqliteTable('safety_incidents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentNo: text('incident_no').notNull().unique(), // 事故编号
  incidentDate: text('incident_date').notNull(),
  incidentType: text('incident_type').notNull(), // injury, near_miss, property_damage, environmental, fire
  severity: text('severity').notNull(), // minor, moderate, serious, fatal
  location: text('location'),
  description: text('description'),
  rootCause: text('root_cause'),
  injuredCount: integer('injured_count').default(0), // 受伤人数
  fatalCount: integer('fatal_count').default(0), // 死亡人数
  lostDays: real('lost_days').default(0), // 损失工时(天)
  directCost: real('direct_cost'), // 直接损失
  correctiveAction: text('corrective_action'), // 纠正措施
  status: text('status').default('open'), // open, investigating, closed
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 社会公益/捐赠记录表 - 用于计算社会责任相关ESG指标
export const donations = sqliteTable('donations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  donationDate: text('donation_date').notNull(),
  donationType: text('donation_type').notNull(), // cash, goods, service, volunteer
  category: text('category'), // education, poverty, disaster, environment, health
  recipient: text('recipient'), // 受捐方
  amount: real('amount'), // 金额或价值
  currency: text('currency').default('CNY'),
  volunteerHours: real('volunteer_hours'), // 志愿服务时长
  volunteerCount: integer('volunteer_count'), // 志愿者人数
  description: text('description'),
  proof: text('proof'), // 证明材料
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 环境合规记录表 - 用于计算环境合规相关ESG指标
export const environmentalCompliance = sqliteTable('environmental_compliance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recordDate: text('record_date').notNull(),
  recordType: text('record_type').notNull(), // violation, penalty, warning, inspection, certification
  authority: text('authority'), // 监管机构
  description: text('description'),
  penaltyAmount: real('penalty_amount'), // 处罚金额
  correctiveAction: text('corrective_action'),
  dueDate: text('due_date'),
  completionDate: text('completion_date'),
  status: text('status').default('open'), // open, resolved, appealing
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============ 新增数据源表 (覆盖完整ESG指标体系) ============

// 水资源消耗数据表 - E3.1 水资源使用与管理
export const waterConsumption = sqliteTable('water_consumption', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(), // 周期: 2024-01, 2024-Q1, 2024
  waterType: text('water_type').notNull(), // fresh(新鲜水), recycled(循环水), rainwater(雨水), reclaimed(再生水)
  source: text('source'), // 来源: municipal(市政), groundwater(地下水), surface(地表水), seawater(海水)
  volume: real('volume').notNull(), // 用水量
  unit: text('unit').notNull().default('m3'), // 单位: m3, ton
  cost: real('cost'), // 费用
  facility: text('facility'), // 设施/区域
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 废水排放数据表 - E2.1 废水排放与管理
export const wasteWaterRecords = sqliteTable('waste_water_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(),
  dischargeType: text('discharge_type').notNull(), // industrial(工业废水), domestic(生活污水), cooling(冷却水)
  pollutantType: text('pollutant_type'), // COD, BOD, ammonia_nitrogen, total_phosphorus, heavy_metals
  concentration: real('concentration'), // 污染物浓度
  concentrationUnit: text('concentration_unit'), // mg/L
  volume: real('volume').notNull(), // 排放量
  volumeUnit: text('volume_unit').notNull().default('m3'), // m3, ton
  standardLimit: real('standard_limit'), // 排放标准限值
  isCompliant: integer('is_compliant', { mode: 'boolean' }).default(true), // 是否达标
  treatmentMethod: text('treatment_method'), // 处理方式
  facility: text('facility'),
  permitNo: text('permit_no'), // 排放许可证号
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 废气排放数据表 - E2.2 废气排放与管理
export const airEmissionRecords = sqliteTable('air_emission_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(),
  emissionSource: text('emission_source').notNull(), // 排放源: boiler, furnace, vehicle, process
  pollutantType: text('pollutant_type').notNull(), // SO2, NOx, PM, VOCs, CO, dust
  concentration: real('concentration'), // 污染物浓度
  concentrationUnit: text('concentration_unit'), // mg/m3
  emissionRate: real('emission_rate'), // 排放速率
  emissionRateUnit: text('emission_rate_unit'), // kg/h
  totalEmission: real('total_emission'), // 总排放量
  totalEmissionUnit: text('total_emission_unit'), // ton, kg
  standardLimit: real('standard_limit'), // 排放标准限值
  isCompliant: integer('is_compliant', { mode: 'boolean' }).default(true),
  treatmentFacility: text('treatment_facility'), // 处理设施
  permitNo: text('permit_no'), // 排放许可证号
  facility: text('facility'),
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 物料消耗数据表 - E3.3 物料使用与管理
export const materialConsumption = sqliteTable('material_consumption', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(),
  materialCategory: text('material_category').notNull(), // raw_material(原材料), packaging(包装材料), auxiliary(辅料)
  materialName: text('material_name').notNull(), // 物料名称
  materialCode: text('material_code'), // 物料编码
  quantity: real('quantity').notNull(), // 消耗量
  unit: text('unit').notNull(), // ton, kg, piece, m2, m3
  cost: real('cost'), // 成本
  isRenewable: integer('is_renewable', { mode: 'boolean' }).default(false), // 是否可再生材料
  isRecycled: integer('is_recycled', { mode: 'boolean' }).default(false), // 是否回收材料
  recycledRatio: real('recycled_ratio'), // 回收成分占比
  supplier: text('supplier'), // 供应商
  facility: text('facility'),
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 噪声监测数据表 - E2.5 噪声污染排放与治理
export const noiseRecords = sqliteTable('noise_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recordDate: text('record_date').notNull(),
  location: text('location').notNull(), // 监测点位
  locationType: text('location_type'), // boundary(厂界), workshop(车间), residential(居民区)
  monitoringTime: text('monitoring_time'), // 监测时段: day, night
  decibelLevel: real('decibel_level').notNull(), // 噪声值 dB(A)
  standardLimit: real('standard_limit'), // 标准限值
  isCompliant: integer('is_compliant', { mode: 'boolean' }).default(true),
  noiseSource: text('noise_source'), // 噪声源
  controlMeasures: text('control_measures'), // 控制措施
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 员工工时记录表 - S1.2.3 员工休息休假权益
export const employeeWorkTime = sqliteTable('employee_work_time', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employees.id),
  employeeNo: text('employee_no'), // 工号（备用关联）
  period: text('period').notNull(), // 周期: 2024-01
  regularHours: real('regular_hours').notNull(), // 正常工时
  overtimeHours: real('overtime_hours').default(0), // 加班工时
  overtimeCompensation: text('overtime_compensation'), // 加班补偿方式: paid, timeoff
  paidLeaveDays: real('paid_leave_days').default(0), // 带薪假天数
  sickLeaveDays: real('sick_leave_days').default(0), // 病假天数
  maternityLeaveDays: real('maternity_leave_days').default(0), // 产假天数
  paternityLeaveDays: real('paternity_leave_days').default(0), // 陪产假天数
  annualLeaveDays: real('annual_leave_days').default(0), // 年假天数
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 薪酬数据表 - S1.2.2 员工获得劳动报酬权益
export const salaryRecords = sqliteTable('salary_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => employees.id),
  employeeNo: text('employee_no'),
  period: text('period').notNull(), // 周期: 2024-01
  baseSalary: real('base_salary').notNull(), // 基本工资
  bonus: real('bonus').default(0), // 奖金
  allowance: real('allowance').default(0), // 津贴
  overtimePay: real('overtime_pay').default(0), // 加班费
  totalCompensation: real('total_compensation'), // 总薪酬
  socialInsurance: real('social_insurance').default(0), // 社保（公司部分）
  housingFund: real('housing_fund').default(0), // 公积金（公司部分）
  gender: text('gender'), // 性别（用于男女薪酬比计算）
  department: text('department'),
  position: text('position'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 董事会成员表 - G1.2 董事会
export const boardMembers = sqliteTable('board_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  gender: text('gender'), // male, female
  birthYear: integer('birth_year'),
  nationality: text('nationality'),
  education: text('education'), // bachelor, master, phd
  position: text('position').notNull(), // chairman(董事长), vice_chairman, director(董事)
  isIndependent: integer('is_independent', { mode: 'boolean' }).default(false), // 是否独立董事
  isExecutive: integer('is_executive', { mode: 'boolean' }).default(false), // 是否执行董事
  appointmentDate: text('appointment_date'), // 任命日期
  termEndDate: text('term_end_date'), // 任期结束日期
  tenure: real('tenure'), // 任期（年）
  otherPositions: text('other_positions'), // 兼任职务
  attendanceRate: real('attendance_rate'), // 出席率
  expertise: text('expertise'), // 专业领域
  status: text('status').default('active'), // active, resigned, retired
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 监事会成员表 - G1.3 监事会
export const supervisors = sqliteTable('supervisors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  gender: text('gender'),
  birthYear: integer('birth_year'),
  education: text('education'),
  position: text('position').notNull(), // chairman(监事会主席), supervisor(监事)
  isExternal: integer('is_external', { mode: 'boolean' }).default(false), // 是否外部监事
  isEmployeeRep: integer('is_employee_rep', { mode: 'boolean' }).default(false), // 是否职工代表监事
  appointmentDate: text('appointment_date'),
  termEndDate: text('term_end_date'),
  tenure: real('tenure'),
  attendanceRate: real('attendance_rate'),
  questionsRaised: integer('questions_raised').default(0), // 提出质询/提议次数
  status: text('status').default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 高管信息表 - G1.4 高级管理层
export const executives = sqliteTable('executives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  gender: text('gender'),
  birthYear: integer('birth_year'),
  education: text('education'),
  position: text('position').notNull(), // CEO, CFO, COO, CTO, VP, etc.
  appointmentDate: text('appointment_date'),
  tenure: real('tenure'),
  annualSalary: real('annual_salary'), // 年薪
  bonus: real('bonus'), // 奖金
  equity: real('equity'), // 股权激励价值
  shareholding: real('shareholding'), // 持股数量
  shareholdingRatio: real('shareholding_ratio'), // 持股比例
  performanceRating: text('performance_rating'), // 绩效评级: A, B, C, D
  trainingHours: real('training_hours'), // 培训时长
  status: text('status').default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 股东信息表 - G1.1 股东会
export const shareholders = sqliteTable('shareholders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // 股东名称
  shareholderType: text('shareholder_type'), // individual(个人), institution(机构), state(国有), foreign(外资)
  shareType: text('share_type'), // common(普通股), preferred(优先股)
  shareCount: real('share_count'), // 持股数量
  shareRatio: real('share_ratio'), // 持股比例
  votingRights: real('voting_rights'), // 投票权比例
  isPledged: integer('is_pledged', { mode: 'boolean' }).default(false), // 是否质押
  pledgeRatio: real('pledge_ratio'), // 质押比例
  isFrozen: integer('is_frozen', { mode: 'boolean' }).default(false), // 是否冻结
  isRelatedParty: integer('is_related_party', { mode: 'boolean' }).default(false), // 是否关联方
  registrationDate: text('registration_date'),
  status: text('status').default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 研发投入表 - S2.2.3 科技创新与知识产权保护
export const rdInvestment = sqliteTable('rd_investment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(),
  projectName: text('project_name'), // 项目名称
  projectCategory: text('project_category'), // basic_research(基础研究), applied_research(应用研究), development(开发)
  investmentAmount: real('investment_amount').notNull(), // 投入金额
  isGreen: integer('is_green', { mode: 'boolean' }).default(false), // 是否绿色研发
  personnelCount: integer('personnel_count'), // 研发人员数
  personnelCost: real('personnel_cost'), // 人员费用
  equipmentCost: real('equipment_cost'), // 设备费用
  materialCost: real('material_cost'), // 材料费用
  department: text('department'),
  status: text('status').default('active'), // active, completed, suspended
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 专利数据表 - S2.2.3 科技创新与知识产权保护
export const patents = sqliteTable('patents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patentNo: text('patent_no').notNull().unique(), // 专利号
  patentName: text('patent_name').notNull(), // 专利名称
  patentType: text('patent_type').notNull(), // invention(发明), utility_model(实用新型), design(外观设计)
  applicationDate: text('application_date'), // 申请日期
  grantDate: text('grant_date'), // 授权日期
  expiryDate: text('expiry_date'), // 到期日期
  inventors: text('inventors'), // 发明人
  isGreen: integer('is_green', { mode: 'boolean' }).default(false), // 是否绿色专利
  status: text('status').default('pending'), // pending(申请中), granted(已授权), expired(已过期), abandoned(已放弃)
  annualFee: real('annual_fee'), // 年费
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 产品质量事件表 - S2.2.2 产品安全与质量
export const productIncidents = sqliteTable('product_incidents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentNo: text('incident_no').notNull(), // 事件编号
  incidentDate: text('incident_date').notNull(),
  incidentType: text('incident_type').notNull(), // recall(召回), complaint(投诉), quality_issue(质量问题), safety_issue(安全问题)
  productName: text('product_name').notNull(),
  productBatch: text('product_batch'), // 产品批次
  affectedQuantity: integer('affected_quantity'), // 影响数量
  description: text('description'),
  rootCause: text('root_cause'),
  correctiveAction: text('corrective_action'),
  compensationAmount: real('compensation_amount'), // 赔偿金额
  resolution: text('resolution'),
  resolutionDate: text('resolution_date'),
  status: text('status').default('open'), // open, investigating, resolved, closed
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 环保投资表 - E4.2.1 生产环保投入
export const environmentInvestments = sqliteTable('environment_investments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(),
  investmentCategory: text('investment_category').notNull(), // facility(环保设施), emission_reduction(污染物减排), insurance(环境责任保险), green_rd(绿色研发), ecological(生态保护), biodiversity(生物多样性)
  projectName: text('project_name'),
  investmentAmount: real('investment_amount').notNull(), // 投资金额
  expectedEffect: text('expected_effect'), // 预期效果
  actualEffect: text('actual_effect'), // 实际效果
  startDate: text('start_date'),
  completionDate: text('completion_date'),
  status: text('status').default('planned'), // planned, in_progress, completed
  facility: text('facility'),
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 公司财务数据表 - 用于计算强度指标的分母
export const companyFinancials = sqliteTable('company_financials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  period: text('period').notNull(), // 2024, 2024-Q1
  revenue: real('revenue'), // 营业收入
  netProfit: real('net_profit'), // 净利润
  totalAssets: real('total_assets'), // 总资产
  productionOutput: real('production_output'), // 产量
  productionUnit: text('production_unit'), // 产量单位
  employeeCount: integer('employee_count'), // 员工人数（期末）
  avgEmployeeCount: real('avg_employee_count'), // 平均员工人数
  operatingArea: real('operating_area'), // 运营面积
  currency: text('currency').default('CNY'),
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 会议记录表 - G1 治理结构相关会议
export const meetingRecords = sqliteTable('meeting_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  meetingType: text('meeting_type').notNull(), // shareholder(股东大会), board(董事会), supervisor(监事会), committee(专门委员会)
  meetingNo: text('meeting_no'), // 会议编号
  meetingDate: text('meeting_date').notNull(),
  meetingName: text('meeting_name'),
  attendeesCount: integer('attendees_count'), // 出席人数
  totalMembers: integer('total_members'), // 应出席人数
  attendanceRate: real('attendance_rate'), // 出席率
  resolutionsCount: integer('resolutions_count'), // 审议议案数
  approvedCount: integer('approved_count'), // 通过议案数
  keyResolutions: text('key_resolutions'), // 重要决议 JSON
  minutes: text('minutes'), // 会议纪要
  status: text('status').default('completed'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 认证许可表 - 各类环保/质量认证
export const certifications = sqliteTable('certifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  certType: text('cert_type').notNull(), // environmental(环保许可), quality(质量认证), safety(安全认证), esg(ESG认证)
  certName: text('cert_name').notNull(), // 证书名称
  certNo: text('cert_no'), // 证书编号
  issuer: text('issuer'), // 发证机构
  issueDate: text('issue_date'),
  expiryDate: text('expiry_date'),
  scope: text('scope'), // 认证范围
  level: text('level'), // 认证等级/级别
  facility: text('facility'),
  status: text('status').default('valid'), // valid, expired, suspended, revoked
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  fileId: integer('file_id').references(() => files.id), // 关联证书文件
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============ 计算引擎相关表 ============

// 指标计算公式表 - 定义每个指标的计算规则
export const metricFormulas = sqliteTable('metric_formulas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  metricId: integer('metric_id').notNull().references(() => esgMetrics.id, { onDelete: 'cascade' }),
  formulaType: text('formula_type').notNull(), // count, sum, avg, ratio, custom
  dataSource: text('data_source').notNull(), // 数据源表名: employees, energy_consumption 等
  formula: text('formula').notNull(), // 计算公式/表达式 JSON
  // 示例: { "type": "ratio", "numerator": "count(gender='female')", "denominator": "count(*)" }
  aggregation: text('aggregation'), // 聚合方式: sum, avg, max, min, last
  filters: text('filters'), // 过滤条件 JSON
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 计算日志表 - 记录每次计算的详情，用于数据溯源
export const calculationLogs = sqliteTable('calculation_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  metricId: integer('metric_id').notNull().references(() => esgMetrics.id),
  recordId: integer('record_id').references(() => esgRecords.id),
  period: text('period').notNull(),
  formulaId: integer('formula_id').references(() => metricFormulas.id),
  inputData: text('input_data'), // 输入数据摘要 JSON
  calculatedValue: real('calculated_value'), // 计算结果
  calculatedAt: integer('calculated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  status: text('status').default('success'), // success, error, warning
  errorMessage: text('error_message'),
  executionTime: integer('execution_time') // 执行耗时(ms)
})

// 类型导出
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type File = typeof files.$inferSelect
export type NewFile = typeof files.$inferInsert
export type EsgModule = typeof esgModules.$inferSelect
export type NewEsgModule = typeof esgModules.$inferInsert
export type EsgSubModule = typeof esgSubModules.$inferSelect
export type NewEsgSubModule = typeof esgSubModules.$inferInsert
export type EsgCategory = typeof esgCategories.$inferSelect
export type NewEsgCategory = typeof esgCategories.$inferInsert
export type EsgMetric = typeof esgMetrics.$inferSelect
export type NewEsgMetric = typeof esgMetrics.$inferInsert
export type EsgRecord = typeof esgRecords.$inferSelect
export type NewEsgRecord = typeof esgRecords.$inferInsert
export type OrgUnit = typeof orgUnits.$inferSelect
export type NewOrgUnit = typeof orgUnits.$inferInsert

// 原始数据源类型
export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert
export type EnergyConsumption = typeof energyConsumption.$inferSelect
export type NewEnergyConsumption = typeof energyConsumption.$inferInsert
export type CarbonEmission = typeof carbonEmissions.$inferSelect
export type NewCarbonEmission = typeof carbonEmissions.$inferInsert
export type WasteData = typeof wasteData.$inferSelect
export type NewWasteData = typeof wasteData.$inferInsert
export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
export type TrainingRecord = typeof trainingRecords.$inferSelect
export type NewTrainingRecord = typeof trainingRecords.$inferInsert
export type SafetyIncident = typeof safetyIncidents.$inferSelect
export type NewSafetyIncident = typeof safetyIncidents.$inferInsert
export type Donation = typeof donations.$inferSelect
export type NewDonation = typeof donations.$inferInsert
export type EnvironmentalCompliance = typeof environmentalCompliance.$inferSelect
export type NewEnvironmentalCompliance = typeof environmentalCompliance.$inferInsert

// 计算引擎类型
export type MetricFormula = typeof metricFormulas.$inferSelect
export type NewMetricFormula = typeof metricFormulas.$inferInsert
export type CalculationLog = typeof calculationLogs.$inferSelect
export type NewCalculationLog = typeof calculationLogs.$inferInsert

// 新增数据源类型
export type WaterConsumption = typeof waterConsumption.$inferSelect
export type NewWaterConsumption = typeof waterConsumption.$inferInsert
export type WasteWaterRecord = typeof wasteWaterRecords.$inferSelect
export type NewWasteWaterRecord = typeof wasteWaterRecords.$inferInsert
export type AirEmissionRecord = typeof airEmissionRecords.$inferSelect
export type NewAirEmissionRecord = typeof airEmissionRecords.$inferInsert
export type MaterialConsumption = typeof materialConsumption.$inferSelect
export type NewMaterialConsumption = typeof materialConsumption.$inferInsert
export type NoiseRecord = typeof noiseRecords.$inferSelect
export type NewNoiseRecord = typeof noiseRecords.$inferInsert
export type EmployeeWorkTime = typeof employeeWorkTime.$inferSelect
export type NewEmployeeWorkTime = typeof employeeWorkTime.$inferInsert
export type SalaryRecord = typeof salaryRecords.$inferSelect
export type NewSalaryRecord = typeof salaryRecords.$inferInsert
export type BoardMember = typeof boardMembers.$inferSelect
export type NewBoardMember = typeof boardMembers.$inferInsert
export type Supervisor = typeof supervisors.$inferSelect
export type NewSupervisor = typeof supervisors.$inferInsert
export type Executive = typeof executives.$inferSelect
export type NewExecutive = typeof executives.$inferInsert
export type Shareholder = typeof shareholders.$inferSelect
export type NewShareholder = typeof shareholders.$inferInsert
export type RdInvestment = typeof rdInvestment.$inferSelect
export type NewRdInvestment = typeof rdInvestment.$inferInsert
export type Patent = typeof patents.$inferSelect
export type NewPatent = typeof patents.$inferInsert
export type ProductIncident = typeof productIncidents.$inferSelect
export type NewProductIncident = typeof productIncidents.$inferInsert
export type EnvironmentInvestment = typeof environmentInvestments.$inferSelect
export type NewEnvironmentInvestment = typeof environmentInvestments.$inferInsert
export type CompanyFinancial = typeof companyFinancials.$inferSelect
export type NewCompanyFinancial = typeof companyFinancials.$inferInsert
export type MeetingRecord = typeof meetingRecords.$inferSelect
export type NewMeetingRecord = typeof meetingRecords.$inferInsert
export type Certification = typeof certifications.$inferSelect
export type NewCertification = typeof certifications.$inferInsert

// ============ 字段映射配置表 ============

// 字段映射模板表 - 存储用户自定义的字段映射关系
export const fieldMappingTemplates = sqliteTable('field_mapping_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // 模板名称，如 "SAP HR导出格式"
  dataSource: text('data_source').notNull(), // 目标数据源: employees, energy_consumption 等
  sourceSystem: text('source_system'), // 来源系统名称，如 "SAP", "用友", "金蝶"
  description: text('description'),
  // 字段映射配置 JSON: { "源字段名": "目标字段名", "员工编号": "employeeNo", ... }
  mappings: text('mappings').notNull(),
  // 值转换规则 JSON: { "gender": { "男": "male", "女": "female" }, ... }
  valueTransforms: text('value_transforms'),
  // 字段别名列表 JSON: { "employeeNo": ["工号", "员工编号", "人员编号", "EmpNo", "emp_id"], ... }
  fieldAliases: text('field_aliases'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false), // 是否为该数据源的默认模板
  usageCount: integer('usage_count').default(0), // 使用次数
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 字段映射类型
export type FieldMappingTemplate = typeof fieldMappingTemplates.$inferSelect
export type NewFieldMappingTemplate = typeof fieldMappingTemplates.$inferInsert
// ============ 合规性检查相关表 ============

// 合规规则定义表 - 存储所有合规检查规则
export const complianceRules = sqliteTable('compliance_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(), // 规则编码: CR001, CR002
  name: text('name').notNull(), // 规则名称
  description: text('description'), // 规则描述
  // 规则类型: required(必填检查), range(范围检查), format(格式检查),
  // consistency(一致性检查), threshold(阈值预警), regulation(法规合规)
  ruleType: text('rule_type').notNull(),
  // 适用的目标指标代码列表 JSON: ["E1.1", "E1.2"] 或 "*" 表示所有
  targetMetrics: text('target_metrics'),
  // 适用的子模块代码 JSON: ["E1", "S1"] 或 "*" 表示所有
  targetSubModules: text('target_sub_modules'),
  // 检查条件配置 JSON:
  // {
  //   "type": "range", "field": "value", "operator": "between", "params": [0, 100],
  //   "expression": "E1.1.1 + E1.1.2 == E1.1", // 用于一致性检查
  //   "standard": "SSE-ESG-2024", "article": "4.2.1" // 用于法规检查
  // }
  condition: text('condition').notNull(),
  // 严重级别: error(阻断保存), warning(警告但允许保存), info(提示信息)
  severity: text('severity').notNull().default('warning'),
  // 关联的法规/标准名称
  regulation: text('regulation'),
  // 提示信息模板，支持变量: {metricName}, {value}, {threshold}
  message: text('message').notNull(),
  // 修复建议
  suggestion: text('suggestion'),
  // 检查触发时机: realtime(实时), submit(提交时), batch(批量检查), scheduled(定时)
  triggerOn: text('trigger_on').default('submit'),
  // 优先级 (数字越小优先级越高)
  priority: integer('priority').default(100),
  // 是否启用
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  // 适用的周期类型: yearly, quarterly, monthly, all
  applicablePeriods: text('applicable_periods').default('all'),
  // 创建信息
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 合规检查结果表 - 存储每次检查的结果
export const complianceResults = sqliteTable('compliance_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 关联的规则
  ruleId: integer('rule_id')
    .notNull()
    .references(() => complianceRules.id, { onDelete: 'cascade' }),
  // 关联的记录 (可选，批量检查时可能不关联具体记录)
  recordId: integer('record_id').references(() => esgRecords.id, { onDelete: 'cascade' }),
  // 检查的指标代码
  metricCode: text('metric_code'),
  // 检查周期
  period: text('period').notNull(),
  // 组织单位
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  // 检查状态: pass(通过), fail(失败), warning(警告), skipped(跳过)
  status: text('status').notNull(),
  // 检查时的值
  checkedValue: text('checked_value'),
  // 期望值或范围
  expectedValue: text('expected_value'),
  // 详细信息 JSON: { actualValue, threshold, expression, ... }
  details: text('details'),
  // 检查时间
  checkedAt: integer('checked_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  // 检查触发方式: manual(手动), auto(自动), scheduled(定时任务)
  triggerType: text('trigger_type').default('auto'),
  // 检查人
  checkedBy: integer('checked_by').references(() => users.id),
  // 解决状态: pending(待处理), resolved(已解决), ignored(已忽略), deferred(延后处理)
  resolveStatus: text('resolve_status').default('pending'),
  // 解决备注
  resolveRemark: text('resolve_remark'),
  // 解决人
  resolvedBy: integer('resolved_by').references(() => users.id),
  // 解决时间
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 合规审计日志表 - 记录所有合规相关操作
export const complianceAuditLogs = sqliteTable('compliance_audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 操作类型: check(检查), resolve(解决), ignore(忽略), rule_change(规则变更), data_change(数据变更)
  action: text('action').notNull(),
  // 目标类型: rule, result, record
  targetType: text('target_type').notNull(),
  // 目标ID
  targetId: integer('target_id'),
  // 操作前数据快照 JSON
  beforeSnapshot: text('before_snapshot'),
  // 操作后数据快照 JSON
  afterSnapshot: text('after_snapshot'),
  // 变更说明
  changeDescription: text('change_description'),
  // 操作人
  operatorId: integer('operator_id').references(() => users.id),
  // 操作人IP
  operatorIp: text('operator_ip'),
  // 操作时间
  operatedAt: integer('operated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 合规检查批次表 - 记录批量检查任务
export const complianceCheckBatches = sqliteTable('compliance_check_batches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 批次编号
  batchNo: text('batch_no').notNull().unique(),
  // 检查范围: full(全量), module(按模块), period(按周期), custom(自定义)
  scope: text('scope').notNull(),
  // 检查参数 JSON: { modules: ["E", "S"], periods: ["2024"], metricCodes: [...] }
  parameters: text('parameters'),
  // 检查状态: pending(待执行), running(执行中), completed(已完成), failed(失败)
  status: text('status').default('pending'),
  // 统计信息 JSON: { total, passed, failed, warnings, skipped }
  statistics: text('statistics'),
  // 开始时间
  startedAt: integer('started_at', { mode: 'timestamp' }),
  // 完成时间
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  // 触发人
  triggeredBy: integer('triggered_by').references(() => users.id),
  // 触发方式: manual, scheduled
  triggerType: text('trigger_type').default('manual'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 合规规则类型
export type ComplianceRule = typeof complianceRules.$inferSelect
export type NewComplianceRule = typeof complianceRules.$inferInsert

// 合规检查结果类型
export type ComplianceResult = typeof complianceResults.$inferSelect
export type NewComplianceResult = typeof complianceResults.$inferInsert

// 合规审计日志类型
export type ComplianceAuditLog = typeof complianceAuditLogs.$inferSelect
export type NewComplianceAuditLog = typeof complianceAuditLogs.$inferInsert

// 合规检查批次类型
export type ComplianceCheckBatch = typeof complianceCheckBatches.$inferSelect
export type NewComplianceCheckBatch = typeof complianceCheckBatches.$inferInsert

// ============ ESG 报告生成模块 ============

// 报告状态常量
export const REPORT_STATUS = {
  DRAFT: 'draft',           // 草稿
  GENERATING: 'generating', // 生成中
  REVIEW: 'review',         // 待审核
  APPROVED: 'approved',     // 已审核
  PUBLISHED: 'published',   // 已发布
  ARCHIVED: 'archived'      // 已归档
} as const

export type ReportStatus = typeof REPORT_STATUS[keyof typeof REPORT_STATUS]

// 报告模板类型常量
export const REPORT_TEMPLATE_TYPE = {
  ANNUAL: 'annual',         // 年度报告
  QUARTERLY: 'quarterly',   // 季度报告
  THEMATIC: 'thematic',     // 主题报告
  COMPLIANCE: 'compliance', // 合规披露
  CUSTOM: 'custom'          // 自定义
} as const

export type ReportTemplateType = typeof REPORT_TEMPLATE_TYPE[keyof typeof REPORT_TEMPLATE_TYPE]

// 报告模板表
export const reportTemplates = sqliteTable('report_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(), // 模板代码
  name: text('name').notNull(), // 模板名称
  description: text('description'), // 模板描述
  type: text('type').notNull().default('annual'), // 模板类型
  // 模板配置 JSON: { sections: [...], variables: {...}, styles: {...} }
  config: text('config').notNull(),
  // 适用的合规标准: GRI, TCFD, SASB, CSRC, SSE, SZSE
  standards: text('standards'),
  // 封面配置 JSON
  coverConfig: text('cover_config'),
  // 是否为系统默认模板
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  // 是否启用
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  // 版本
  version: text('version').default('1.0'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ESG 报告主表
export const esgReports = sqliteTable('esg_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 报告基本信息
  title: text('title').notNull(), // 报告标题
  period: text('period').notNull(), // 报告周期: 2024, 2024-Q1
  periodType: text('period_type').default('yearly'), // yearly, quarterly, monthly
  // 关联模板
  templateId: integer('template_id').references(() => reportTemplates.id),
  // 公司信息
  companyName: text('company_name'),
  companyLogo: text('company_logo'), // Logo 文件路径
  // 报告状态
  status: text('status').notNull().default('draft'),
  // 报告配置 JSON: { includeSections: [], excludeMetrics: [], language: 'zh-CN' }
  config: text('config'),
  // 生成进度 (0-100)
  progress: integer('progress').default(0),
  // 生成错误信息
  errorMessage: text('error_message'),
  // 最终生成的 HTML 内容
  htmlContent: text('html_content'),
  // 导出文件路径 JSON: { pdf: 'path', docx: 'path', xlsx: 'path' }
  exportFiles: text('export_files'),
  // 合规检查结果摘要 JSON
  complianceSummary: text('compliance_summary'),
  // 数据完整性摘要 JSON
  dataIntegritySummary: text('data_integrity_summary'),
  // 审核信息
  submittedBy: integer('submitted_by').references(() => users.id),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewComment: text('review_comment'),
  publishedBy: integer('published_by').references(() => users.id),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  // 创建信息
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 报告章节内容表
export const reportSections = sqliteTable('report_sections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportId: integer('report_id')
    .notNull()
    .references(() => esgReports.id, { onDelete: 'cascade' }),
  // 章节代码: executive_summary, E, E1, E1.1, S, G 等
  sectionCode: text('section_code').notNull(),
  // 章节标题
  title: text('title').notNull(),
  // 章节层级: 1, 2, 3, 4
  level: integer('level').default(1),
  // 排序
  sortOrder: integer('sort_order').default(0),
  // 章节内容 (Markdown/HTML)
  content: text('content'),
  // AI 生成的原始内容 (用于对比)
  aiGeneratedContent: text('ai_generated_content'),
  // 是否使用 AI 生成
  isAiGenerated: integer('is_ai_generated', { mode: 'boolean' }).default(false),
  // 是否已人工编辑
  isManuallyEdited: integer('is_manually_edited', { mode: 'boolean' }).default(false),
  // 关联的指标数据 JSON: [{ metricCode, value, unit, period }]
  metricsData: text('metrics_data'),
  // 图表配置 JSON: [{ type, title, data, options }]
  chartsConfig: text('charts_config'),
  // 状态: draft, generating, completed, error
  status: text('status').default('draft'),
  // 生成错误信息
  errorMessage: text('error_message'),
  // Token 使用统计
  tokensUsed: integer('tokens_used').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 报告版本历史表
export const reportVersions = sqliteTable('report_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportId: integer('report_id')
    .notNull()
    .references(() => esgReports.id, { onDelete: 'cascade' }),
  // 版本号
  versionNumber: integer('version_number').notNull(),
  // 版本标签: v1.0, draft-1, review-1
  versionTag: text('version_tag'),
  // 变更说明
  changeDescription: text('change_description'),
  // 完整内容快照 JSON
  contentSnapshot: text('content_snapshot'),
  // 文件快照路径
  fileSnapshot: text('file_snapshot'),
  // 创建人
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// AI 内容缓存表 (避免重复调用 LLM)
export const aiContentCache = sqliteTable('ai_content_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 缓存键: {reportId}_{sectionCode}_{dataHash}
  cacheKey: text('cache_key').notNull().unique(),
  // 报告ID
  reportId: integer('report_id').references(() => esgReports.id, { onDelete: 'cascade' }),
  // 章节代码
  sectionCode: text('section_code'),
  // 输入数据的哈希 (用于判断数据是否变化)
  dataHash: text('data_hash'),
  // 使用的 Prompt 模板版本
  promptVersion: text('prompt_version'),
  // AI 生成的内容
  content: text('content').notNull(),
  // 使用的模型
  model: text('model'),
  // Token 统计
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  // 生成耗时 (ms)
  generationTime: integer('generation_time'),
  // 过期时间
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 报告生成任务表 (异步任务队列)
export const reportGenerationTasks = sqliteTable('report_generation_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportId: integer('report_id')
    .notNull()
    .references(() => esgReports.id, { onDelete: 'cascade' }),
  // 任务类型: full(完整生成), section(章节生成), export(导出)
  taskType: text('task_type').notNull(),
  // 任务参数 JSON
  parameters: text('parameters'),
  // 任务状态: pending, running, completed, failed, cancelled
  status: text('status').default('pending'),
  // 进度 (0-100)
  progress: integer('progress').default(0),
  // 当前步骤描述
  currentStep: text('current_step'),
  // 错误信息
  errorMessage: text('error_message'),
  // 结果数据 JSON
  result: text('result'),
  // 开始时间
  startedAt: integer('started_at', { mode: 'timestamp' }),
  // 完成时间
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  // 创建人
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 报告类型导出
export type ReportTemplate = typeof reportTemplates.$inferSelect
export type NewReportTemplate = typeof reportTemplates.$inferInsert
export type EsgReport = typeof esgReports.$inferSelect
export type NewEsgReport = typeof esgReports.$inferInsert
export type ReportSection = typeof reportSections.$inferSelect
export type NewReportSection = typeof reportSections.$inferInsert
export type ReportVersion = typeof reportVersions.$inferSelect
export type NewReportVersion = typeof reportVersions.$inferInsert
export type AiContentCache = typeof aiContentCache.$inferSelect
export type NewAiContentCache = typeof aiContentCache.$inferInsert
export type ReportGenerationTask = typeof reportGenerationTasks.$inferSelect
export type NewReportGenerationTask = typeof reportGenerationTasks.$inferInsert

// ============ 国际标准框架模块 ============

// 标准类型常量
export const STANDARD_STATUS = {
  ACTIVE: 'active',       // 生效中
  DRAFT: 'draft',         // 草案
  SUPERSEDED: 'superseded', // 已被取代
  WITHDRAWN: 'withdrawn'  // 已撤销
} as const

export type StandardStatus = typeof STANDARD_STATUS[keyof typeof STANDARD_STATUS]

// 披露要求级别
export const DISCLOSURE_LEVEL = {
  MANDATORY: 'mandatory',     // 强制披露
  COMPLY_EXPLAIN: 'comply_or_explain', // 不遵守则解释
  VOLUNTARY: 'voluntary',     // 自愿披露
  RECOMMENDED: 'recommended'  // 建议披露
} as const

export type DisclosureLevel = typeof DISCLOSURE_LEVEL[keyof typeof DISCLOSURE_LEVEL]

// 国际标准注册表 - 存储各国际/国内ESG标准
export const esgStandards = sqliteTable('esg_standards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(), // 标准代码: GRI, CSRD, SEC-CLIMATE, SSE-ESG, SZSE-ESG, ISSB, TCFD
  name: text('name').notNull(), // 标准名称
  nameEn: text('name_en'), // 英文名称
  // 发布组织/监管机构
  issuer: text('issuer').notNull(), // GRI, EU, SEC, 上交所, 深交所, ISSB
  // 适用地区 JSON: ["global", "EU", "US", "CN"]
  applicableRegions: text('applicable_regions').notNull(),
  // 标准类型: framework(框架), regulation(法规), guideline(指南), rating(评级)
  standardType: text('standard_type').notNull(),
  // 标准版本
  version: text('version'),
  // 生效日期
  effectiveDate: text('effective_date'),
  // 下次修订日期
  nextRevisionDate: text('next_revision_date'),
  // 标准状态
  status: text('status').notNull().default('active'),
  // 标准描述
  description: text('description'),
  // 官方链接
  officialUrl: text('official_url'),
  // 标准配置 JSON: { reportingPeriod, filingDeadlines, assuranceRequired, ... }
  config: text('config'),
  // 排序
  sortOrder: integer('sort_order').default(0),
  // 是否启用
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 标准主题/类别表 - 标准内的主题分组
export const standardTopics = sqliteTable('standard_topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  standardId: integer('standard_id')
    .notNull()
    .references(() => esgStandards.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'), // 支持多级主题
  code: text('code').notNull(), // 主题代码: ESRS-E1, GRI-302
  name: text('name').notNull(),
  nameEn: text('name_en'),
  // 主题类型: topic(主题), sub-topic(子主题), disclosure(披露项)
  topicType: text('topic_type').default('topic'),
  // 对应的ESG维度: E, S, G, general
  dimension: text('dimension'),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 标准指标定义表 - 标准内定义的具体指标/披露项
export const standardMetrics = sqliteTable('standard_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  standardId: integer('standard_id')
    .notNull()
    .references(() => esgStandards.id, { onDelete: 'cascade' }),
  topicId: integer('topic_id').references(() => standardTopics.id, { onDelete: 'set null' }),
  // 指标代码: GRI 302-1, ESRS E1-6, SEC Item 1502
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  // 指标描述/定义
  description: text('description'),
  descriptionEn: text('description_en'),
  // 披露要求级别
  disclosureLevel: text('disclosure_level').default('mandatory'),
  // 数据类型: quantitative(定量), qualitative(定性), both(两者)
  dataType: text('data_type').default('quantitative'),
  // 计量单位
  unit: text('unit'),
  // 报告频率: annual, quarterly, event-driven
  frequency: text('frequency').default('annual'),
  // 计算方法/指南
  calculationGuidance: text('calculation_guidance'),
  // 相关参考 JSON: { paragraph, appendix, examples }
  references: text('references'),
  // 关联的其他标准指标 JSON: [{ standardCode, metricCode }]
  crossReferences: text('cross_references'),
  // 是否需要鉴证
  assuranceRequired: integer('assurance_required', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 指标映射表 - 本地ESG指标与国际标准指标的映射关系
export const metricMappings = sqliteTable('metric_mappings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 本地指标ID
  localMetricId: integer('local_metric_id')
    .notNull()
    .references(() => esgMetrics.id, { onDelete: 'cascade' }),
  // 标准指标ID
  standardMetricId: integer('standard_metric_id')
    .notNull()
    .references(() => standardMetrics.id, { onDelete: 'cascade' }),
  // 映射关系类型:
  // exact(完全匹配), partial(部分匹配), aggregated(聚合), derived(派生), proxy(代理)
  mappingType: text('mapping_type').notNull().default('exact'),
  // 映射置信度 (0-100)
  confidence: integer('confidence').default(100),
  // 转换说明/公式
  transformationNotes: text('transformation_notes'),
  // 转换公式 JSON (用于需要计算转换的场景)
  transformationFormula: text('transformation_formula'),
  // 单位转换因子
  unitConversionFactor: real('unit_conversion_factor'),
  // 数据差异说明
  dataDifferenceNotes: text('data_difference_notes'),
  // 是否需要补充数据
  requiresAdditionalData: integer('requires_additional_data', { mode: 'boolean' }).default(false),
  // 补充数据说明
  additionalDataNotes: text('additional_data_notes'),
  // 是否自动映射 (由系统推荐)
  isAutoMapped: integer('is_auto_mapped', { mode: 'boolean' }).default(false),
  // 是否已验证
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  // 启用状态
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 披露要求表 - 各标准对企业的具体披露要求
export const disclosureRequirements = sqliteTable('disclosure_requirements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  standardId: integer('standard_id')
    .notNull()
    .references(() => esgStandards.id, { onDelete: 'cascade' }),
  // 要求代码
  code: text('code').notNull(),
  // 要求标题
  title: text('title').notNull(),
  titleEn: text('title_en'),
  // 要求描述
  description: text('description'),
  descriptionEn: text('description_en'),
  // 披露级别
  disclosureLevel: text('disclosure_level').notNull().default('mandatory'),
  // 适用条件 JSON: { revenueThreshold, employeeThreshold, industryTypes, listingStatus }
  applicabilityConditions: text('applicability_conditions'),
  // 适用行业 JSON: ["all"] 或 ["energy", "manufacturing", "finance"]
  applicableIndustries: text('applicable_industries'),
  // 报告位置/章节建议
  reportingLocation: text('reporting_location'),
  // 报告格式要求
  formatRequirements: text('format_requirements'),
  // 截止日期规则 JSON: { type: "relative", daysAfterPeriodEnd: 120 }
  deadlineRule: text('deadline_rule'),
  // 违规后果说明
  nonComplianceConsequences: text('non_compliance_consequences'),
  // 豁免条件
  exemptions: text('exemptions'),
  // 过渡期安排
  transitionProvisions: text('transition_provisions'),
  // 关联的标准指标ID列表 JSON
  relatedMetricIds: text('related_metric_ids'),
  // 优先级
  priority: integer('priority').default(100),
  sortOrder: integer('sort_order').default(0),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 企业标准采用配置表 - 记录企业选择遵循的标准
export const companyStandardConfigs = sqliteTable('company_standard_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 组织单位 (可选，用于多实体企业)
  orgUnitId: integer('org_unit_id').references(() => orgUnits.id),
  // 采用的标准
  standardId: integer('standard_id')
    .notNull()
    .references(() => esgStandards.id, { onDelete: 'cascade' }),
  // 采用状态: planning(计划中), implementing(实施中), compliant(已合规), partial(部分合规)
  adoptionStatus: text('adoption_status').default('planning'),
  // 首次采用年份
  firstAdoptionYear: integer('first_adoption_year'),
  // 目标合规年份
  targetComplianceYear: integer('target_compliance_year'),
  // 当前合规率 (0-100)
  complianceRate: real('compliance_rate').default(0),
  // 负责人
  responsibleUserId: integer('responsible_user_id').references(() => users.id),
  // 配置项 JSON: { excludedMetrics: [], customMappings: {}, reportingCycle: "annual" }
  config: text('config'),
  // 备注
  notes: text('notes'),
  // 是否为主要标准
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 标准合规追踪表 - 追踪各标准指标的完成情况
export const standardComplianceTracking = sqliteTable('standard_compliance_tracking', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 企业标准配置
  companyStandardConfigId: integer('company_standard_config_id')
    .notNull()
    .references(() => companyStandardConfigs.id, { onDelete: 'cascade' }),
  // 标准指标
  standardMetricId: integer('standard_metric_id')
    .notNull()
    .references(() => standardMetrics.id, { onDelete: 'cascade' }),
  // 报告周期
  period: text('period').notNull(),
  // 完成状态: not_started, in_progress, completed, not_applicable, exempted
  status: text('status').default('not_started'),
  // 完成度 (0-100)
  completionRate: integer('completion_rate').default(0),
  // 关联的本地记录ID列表 JSON
  localRecordIds: text('local_record_ids'),
  // 披露内容摘要
  disclosureSummary: text('disclosure_summary'),
  // 数据质量评估: high, medium, low
  dataQuality: text('data_quality'),
  // 是否已验证
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  // 备注/说明
  notes: text('notes'),
  // 不适用/豁免原因
  exemptionReason: text('exemption_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 标准更新日志表 - 追踪标准的变更历史
export const standardUpdateLogs = sqliteTable('standard_update_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  standardId: integer('standard_id')
    .notNull()
    .references(() => esgStandards.id, { onDelete: 'cascade' }),
  // 更新类型: new_version(新版本), amendment(修订), interpretation(解释), withdrawal(撤销)
  updateType: text('update_type').notNull(),
  // 更新日期
  updateDate: text('update_date').notNull(),
  // 旧版本号
  previousVersion: text('previous_version'),
  // 新版本号
  newVersion: text('new_version'),
  // 变更摘要
  changeSummary: text('change_summary'),
  // 变更详情 JSON
  changeDetails: text('change_details'),
  // 影响评估
  impactAssessment: text('impact_assessment'),
  // 过渡期截止日期
  transitionDeadline: text('transition_deadline'),
  // 来源链接
  sourceUrl: text('source_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// 国际标准类型导出
export type EsgStandard = typeof esgStandards.$inferSelect
export type NewEsgStandard = typeof esgStandards.$inferInsert
export type StandardTopic = typeof standardTopics.$inferSelect
export type NewStandardTopic = typeof standardTopics.$inferInsert
export type StandardMetric = typeof standardMetrics.$inferSelect
export type NewStandardMetric = typeof standardMetrics.$inferInsert
export type MetricMapping = typeof metricMappings.$inferSelect
export type NewMetricMapping = typeof metricMappings.$inferInsert
export type DisclosureRequirement = typeof disclosureRequirements.$inferSelect
export type NewDisclosureRequirement = typeof disclosureRequirements.$inferInsert
export type CompanyStandardConfig = typeof companyStandardConfigs.$inferSelect
export type NewCompanyStandardConfig = typeof companyStandardConfigs.$inferInsert
export type StandardComplianceTracking = typeof standardComplianceTracking.$inferSelect
export type NewStandardComplianceTracking = typeof standardComplianceTracking.$inferInsert
export type StandardUpdateLog = typeof standardUpdateLogs.$inferSelect
export type NewStandardUpdateLog = typeof standardUpdateLogs.$inferInsert