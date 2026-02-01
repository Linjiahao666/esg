/**
 * 智能字段匹配工具
 * 
 * 基于字段名相似度和预设别名自动推荐字段映射
 * 支持24个ESG数据源的完整字段配置
 */

// 各数据源的标准字段定义
export const dataSourceFields: Record<string, {
  fields: { key: string; label: string; required?: boolean; type?: string }[]
  aliases: Record<string, string[]>
  valueTransforms: Record<string, Record<string, string | boolean | number>>
}> = {
  employees: {
    fields: [
      { key: 'employeeNo', label: '工号', required: true },
      { key: 'name', label: '姓名', required: true },
      { key: 'gender', label: '性别' },
      { key: 'birthDate', label: '出生日期' },
      { key: 'department', label: '部门' },
      { key: 'position', label: '职位' },
      { key: 'level', label: '职级' },
      { key: 'employeeType', label: '员工类型' },
      { key: 'isPartyMember', label: '是否党员', type: 'boolean' },
      { key: 'isUnionMember', label: '是否工会成员', type: 'boolean' },
      { key: 'isDisabled', label: '是否残疾人', type: 'boolean' },
      { key: 'isMinority', label: '是否少数民族', type: 'boolean' },
      { key: 'education', label: '学历' },
      { key: 'hireDate', label: '入职日期' },
      { key: 'leaveDate', label: '离职日期' },
      { key: 'leaveReason', label: '离职原因' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      employeeNo: ['工号', '员工编号', '人员编号', '员工号', '职工号', 'EmpNo', 'emp_no', 'emp_id', 'employee_id', 'staff_no', 'staff_id', '编号'],
      name: ['姓名', '员工姓名', '名称', 'Name', 'emp_name', 'employee_name', 'staff_name', '职工姓名'],
      gender: ['性别', '员工性别', 'Gender', 'Sex', 'sex'],
      birthDate: ['出生日期', '生日', '出生年月', 'Birthday', 'birth_date', 'date_of_birth', 'DOB'],
      department: ['部门', '所属部门', '部门名称', 'Department', 'dept', 'dept_name', '组织', '组织名称'],
      position: ['职位', '岗位', '职务', '岗位名称', 'Position', 'Job', 'job_title', '职称'],
      level: ['职级', '级别', '等级', '员工级别', 'Level', 'Grade', 'rank'],
      employeeType: ['员工类型', '用工类型', '人员类型', '合同类型', 'Type', 'emp_type', 'employee_type', '用工形式'],
      isPartyMember: ['是否党员', '党员', '政治面貌', 'Party', 'party_member', '中共党员'],
      isUnionMember: ['是否工会成员', '工会会员', '工会', 'Union', 'union_member'],
      isDisabled: ['是否残疾人', '残疾人', '残疾', 'Disabled', 'disability'],
      isMinority: ['是否少数民族', '少数民族', '民族', 'Minority', 'ethnic'],
      education: ['学历', '最高学历', '学历层次', 'Education', 'edu', 'degree', '文化程度'],
      hireDate: ['入职日期', '入职时间', '加入日期', '聘用日期', 'HireDate', 'hire_date', 'join_date', 'start_date', '报到日期'],
      leaveDate: ['离职日期', '离职时间', '终止日期', 'LeaveDate', 'leave_date', 'end_date', 'termination_date'],
      leaveReason: ['离职原因', '离职类型', '离职方式', 'leave_reason', 'resignation_reason'],
      status: ['状态', '员工状态', '在职状态', 'Status', 'emp_status', '人员状态', '是否在职']
    },
    valueTransforms: {
      gender: { '男': 'male', '女': 'female', 'M': 'male', 'F': 'female', '1': 'male', '2': 'female', '0': 'male' },
      status: { '在职': 'active', '离职': 'resigned', '退休': 'retired', '1': 'active', '0': 'resigned', 'A': 'active', 'I': 'resigned' },
      isPartyMember: { '是': true, '否': false, '党员': true, '群众': false, 'Y': true, 'N': false, '1': true, '0': false },
      isUnionMember: { '是': true, '否': false, 'Y': true, 'N': false, '1': true, '0': false },
      isDisabled: { '是': true, '否': false, 'Y': true, 'N': false, '1': true, '0': false },
      isMinority: { '是': true, '否': false, 'Y': true, 'N': false, '1': true, '0': false },
      employeeType: { '正式': 'fulltime', '合同': 'contract', '实习': 'intern', '派遣': 'dispatch', '劳务': 'dispatch', '临时': 'contract' },
      education: { '博士': 'phd', '硕士': 'master', '本科': 'bachelor', '大专': 'college', '高中': 'high_school', '中专': 'high_school' },
      leaveReason: { '主动离职': 'voluntary', '被动离职': 'involuntary', '退休': 'retirement', '辞职': 'voluntary', '辞退': 'involuntary', '合同到期': 'contract_end' }
    }
  },
  energy_consumption: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'energyType', label: '能源类型', required: true },
      { key: 'consumption', label: '消耗量', required: true, type: 'number' },
      { key: 'unit', label: '单位', required: true },
      { key: 'cost', label: '费用', type: 'number' },
      { key: 'facility', label: '设施' },
      { key: 'source', label: '来源' },
      { key: 'isRenewable', label: '是否可再生', type: 'boolean' }
    ],
    aliases: {
      period: ['周期', '时间', '月份', '年月', 'Period', 'Date', 'Month', 'Year', '统计周期', '报告期'],
      energyType: ['能源类型', '能源种类', '类型', 'Type', 'energy_type', '能源名称'],
      consumption: ['消耗量', '用量', '使用量', '消费量', 'Consumption', 'Usage', 'Amount', 'Quantity', '数量'],
      unit: ['单位', '计量单位', 'Unit', '单位名称'],
      cost: ['费用', '金额', '成本', '花费', 'Cost', 'Amount', 'Price', '支出'],
      facility: ['设施', '设备', '区域', '位置', 'Facility', 'Location', 'Area', '地点'],
      source: ['来源', '供应商', '电力来源', 'Source', 'Provider', '供应来源'],
      isRenewable: ['是否可再生', '可再生', '绿色能源', 'Renewable', 'Green', '清洁能源']
    },
    valueTransforms: {
      energyType: { '电': 'electricity', '电力': 'electricity', '天然气': 'natural_gas', '燃气': 'natural_gas', '水': 'water', '煤': 'coal', '汽油': 'gasoline', '柴油': 'diesel', '蒸汽': 'steam' },
      isRenewable: { '是': true, '否': false, 'Y': true, 'N': false, '1': true, '0': false },
      source: { '电网': 'grid', '光伏': 'solar', '风电': 'wind', '自发电': 'self_generated' }
    }
  },
  suppliers: {
    fields: [
      { key: 'code', label: '供应商编号', required: true },
      { key: 'name', label: '供应商名称', required: true },
      { key: 'category', label: '类别' },
      { key: 'region', label: '地区' },
      { key: 'isLocal', label: '是否本地', type: 'boolean' },
      { key: 'contractAmount', label: '合同金额', type: 'number' },
      { key: 'esgRating', label: 'ESG评级' },
      { key: 'hasCertification', label: '是否有认证', type: 'boolean' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      code: ['供应商编号', '编号', '供应商代码', 'Code', 'Vendor_No', 'supplier_id', '代码'],
      name: ['供应商名称', '名称', '供应商', 'Name', 'Vendor_Name', 'supplier_name', '公司名称'],
      category: ['类别', '分类', '供应商类型', 'Category', 'Type', '行业'],
      region: ['地区', '区域', '省份', '城市', 'Region', 'Location', 'Province', 'City', '所在地'],
      isLocal: ['是否本地', '本地供应商', '本地', 'Local', 'is_local', '属地'],
      contractAmount: ['合同金额', '交易金额', '采购金额', 'Amount', 'Contract_Amount', '金额'],
      esgRating: ['ESG评级', '评级', '等级', 'Rating', 'ESG_Rating', '供应商评级'],
      hasCertification: ['是否有认证', '认证', 'Certification', '有无认证', 'ESG认证'],
      status: ['状态', '合作状态', 'Status', '供应商状态']
    },
    valueTransforms: {
      isLocal: { '是': true, '否': false, 'Y': true, 'N': false, '1': true, '0': false, '本地': true },
      hasCertification: { '是': true, '否': false, 'Y': true, 'N': false, '1': true, '0': false, '有': true, '无': false },
      status: { '合作中': 'active', '暂停': 'suspended', '终止': 'terminated', '正常': 'active' },
      category: { '原材料': 'raw_material', '设备': 'equipment', '服务': 'service', '物流': 'logistics' }
    }
  },
  training_records: {
    fields: [
      { key: 'employeeNo', label: '员工工号' },
      { key: 'trainingType', label: '培训类型', required: true },
      { key: 'trainingName', label: '培训名称', required: true },
      { key: 'trainingDate', label: '培训日期', required: true },
      { key: 'duration', label: '时长(小时)', required: true, type: 'number' },
      { key: 'cost', label: '费用', type: 'number' },
      { key: 'provider', label: '培训机构' },
      { key: 'isOnline', label: '是否在线', type: 'boolean' },
      { key: 'isPassed', label: '是否通过', type: 'boolean' }
    ],
    aliases: {
      employeeNo: ['员工工号', '工号', '人员编号', 'EmpNo', 'employee_no'],
      trainingType: ['培训类型', '类型', '培训类别', 'Type', 'training_type', '课程类型'],
      trainingName: ['培训名称', '课程名称', '培训课程', 'Name', 'Course', 'training_name', '课程'],
      trainingDate: ['培训日期', '日期', '培训时间', 'Date', 'training_date', '完成日期'],
      duration: ['时长(小时)', '时长', '学时', '小时数', 'Duration', 'Hours', '培训时长'],
      cost: ['费用', '培训费用', '成本', 'Cost', '培训成本'],
      provider: ['培训机构', '机构', '供应商', 'Provider', '培训单位', '讲师'],
      isOnline: ['是否在线', '在线', '线上', 'Online', '培训方式'],
      isPassed: ['是否通过', '通过', '考核结果', 'Passed', '合格']
    },
    valueTransforms: {
      trainingType: { '安全': 'safety', '环保': 'environmental', '合规': 'compliance', '技能': 'skill', '领导力': 'leadership', 'ESG': 'esg', '安全生产': 'safety' },
      isOnline: { '是': true, '否': false, '线上': true, '线下': false, 'Y': true, 'N': false },
      isPassed: { '是': true, '否': false, '通过': true, '不通过': false, '合格': true, '不合格': false }
    }
  },
  safety_incidents: {
    fields: [
      { key: 'incidentNo', label: '事故编号', required: true },
      { key: 'incidentDate', label: '事故日期', required: true },
      { key: 'incidentType', label: '事故类型', required: true },
      { key: 'severity', label: '严重程度', required: true },
      { key: 'location', label: '地点' },
      { key: 'description', label: '描述' },
      { key: 'injuredCount', label: '受伤人数', type: 'number' },
      { key: 'fatalCount', label: '死亡人数', type: 'number' },
      { key: 'lostDays', label: '损失工时', type: 'number' },
      { key: 'directCost', label: '直接损失', type: 'number' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      incidentNo: ['事故编号', '编号', '案例号', 'No', 'incident_no', 'case_no'],
      incidentDate: ['事故日期', '日期', '发生日期', 'Date', 'incident_date', '发生时间'],
      incidentType: ['事故类型', '类型', '类别', 'Type', 'incident_type', '事件类型'],
      severity: ['严重程度', '等级', '级别', 'Severity', 'Level', '事故等级'],
      location: ['地点', '位置', '发生地点', 'Location', 'Area', '事发地点'],
      description: ['描述', '事故描述', '详情', 'Description', '事件描述'],
      injuredCount: ['受伤人数', '伤亡人数', '受伤', 'Injured', 'injury_count'],
      fatalCount: ['死亡人数', '死亡', 'Fatal', 'fatality_count'],
      lostDays: ['损失工时', '损失天数', '工时损失', 'Lost_Days', 'lost_time'],
      directCost: ['直接损失', '经济损失', '损失金额', 'Cost', 'direct_cost'],
      status: ['状态', '处理状态', 'Status', '案件状态']
    },
    valueTransforms: {
      incidentType: { '工伤': 'injury', '未遂': 'near_miss', '财产损失': 'property_damage', '环境': 'environmental', '火灾': 'fire' },
      severity: { '轻微': 'minor', '一般': 'moderate', '严重': 'serious', '死亡': 'fatal' },
      status: { '处理中': 'open', '调查中': 'investigating', '已关闭': 'closed', '开放': 'open' }
    }
  },
  donations: {
    fields: [
      { key: 'donationDate', label: '捐赠日期', required: true },
      { key: 'donationType', label: '捐赠类型', required: true },
      { key: 'category', label: '类别' },
      { key: 'recipient', label: '受捐方' },
      { key: 'amount', label: '金额', type: 'number' },
      { key: 'volunteerHours', label: '志愿服务时长', type: 'number' },
      { key: 'volunteerCount', label: '志愿者人数', type: 'number' },
      { key: 'description', label: '描述' }
    ],
    aliases: {
      donationDate: ['捐赠日期', '日期', '时间', 'Date', 'donation_date'],
      donationType: ['捐赠类型', '类型', '方式', 'Type', 'donation_type'],
      category: ['类别', '领域', '分类', 'Category', '捐赠领域'],
      recipient: ['受捐方', '受益方', '捐赠对象', 'Recipient', '接收方'],
      amount: ['金额', '捐赠金额', '价值', 'Amount', 'Value'],
      volunteerHours: ['志愿服务时长', '志愿时长', '服务时长', 'Hours', 'volunteer_hours'],
      volunteerCount: ['志愿者人数', '参与人数', '人数', 'Count', 'volunteer_count'],
      description: ['描述', '备注', '说明', 'Description', 'Remark']
    },
    valueTransforms: {
      donationType: { '现金': 'cash', '物资': 'goods', '服务': 'service', '志愿': 'volunteer' },
      category: { '教育': 'education', '扶贫': 'poverty', '救灾': 'disaster', '环保': 'environment', '健康': 'health', '乡村振兴': 'rural_development' }
    }
  },
  waste_data: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'wasteType', label: '废物类型', required: true },
      { key: 'wasteName', label: '废物名称', required: true },
      { key: 'quantity', label: '数量', required: true, type: 'number' },
      { key: 'unit', label: '单位', required: true },
      { key: 'disposalMethod', label: '处置方式' },
      { key: 'disposalVendor', label: '处置单位' },
      { key: 'isCompliant', label: '是否合规', type: 'boolean' }
    ],
    aliases: {
      period: ['周期', '时间', '月份', 'Period', 'Date'],
      wasteType: ['废物类型', '类型', '废物分类', 'Type', 'waste_type'],
      wasteName: ['废物名称', '名称', '废物', 'Name', 'waste_name'],
      quantity: ['数量', '产生量', '重量', 'Quantity', 'Amount', 'Weight'],
      unit: ['单位', '计量单位', 'Unit'],
      disposalMethod: ['处置方式', '处理方式', '处置方法', 'Method', 'disposal_method'],
      disposalVendor: ['处置单位', '处理单位', '处置商', 'Vendor', 'disposal_vendor'],
      isCompliant: ['是否合规', '合规', '合法', 'Compliant', '合规处置']
    },
    valueTransforms: {
      wasteType: { '一般': 'general', '危废': 'hazardous', '危险': 'hazardous', '可回收': 'recyclable', '有机': 'organic' },
      disposalMethod: { '填埋': 'landfill', '焚烧': 'incineration', '回收': 'recycling', '再利用': 'reuse', '处理': 'treatment' },
      isCompliant: { '是': true, '否': false, '合规': true, '不合规': false }
    }
  },
  carbon_emissions: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'scope', label: '范围', required: true, type: 'number' },
      { key: 'category', label: '类别', required: true },
      { key: 'source', label: '排放源', required: true },
      { key: 'activityData', label: '活动数据', type: 'number' },
      { key: 'activityUnit', label: '活动单位' },
      { key: 'emissionFactor', label: '排放因子', type: 'number' },
      { key: 'emission', label: '排放量(tCO2e)', required: true, type: 'number' }
    ],
    aliases: {
      period: ['周期', '时间', '年份', 'Period', 'Year'],
      scope: ['范围', '排放范围', 'Scope', 'scope'],
      category: ['类别', '排放类别', '分类', 'Category'],
      source: ['排放源', '来源', '排放来源', 'Source'],
      activityData: ['活动数据', '活动量', '消耗量', 'Activity', 'activity_data'],
      activityUnit: ['活动单位', '单位', 'Unit', 'activity_unit'],
      emissionFactor: ['排放因子', '因子', 'Factor', 'emission_factor'],
      emission: ['排放量(tCO2e)', '排放量', 'CO2排放', 'Emission', 'emission', 'tCO2e']
    },
    valueTransforms: {
      scope: { '范围1': 1, '范围2': 2, '范围3': 3, 'Scope 1': 1, 'Scope 2': 2, 'Scope 3': 3, '1': 1, '2': 2, '3': 3 }
    }
  },
  // ============ 新增数据源字段配置 ============

  // 水资源消耗 - E3.1
  water_consumption: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'waterType', label: '水类型', required: true },
      { key: 'source', label: '来源' },
      { key: 'volume', label: '用水量', required: true, type: 'number' },
      { key: 'unit', label: '单位', required: true },
      { key: 'cost', label: '费用', type: 'number' },
      { key: 'facility', label: '设施' }
    ],
    aliases: {
      period: ['周期', '时间', '月份', 'Period', 'Date', '统计周期'],
      waterType: ['水类型', '用水类型', '水源类型', 'Type', 'water_type', '类型'],
      source: ['来源', '水源', '供水来源', 'Source', '取水来源'],
      volume: ['用水量', '水量', '消耗量', 'Volume', 'Consumption', '使用量'],
      unit: ['单位', 'Unit', '计量单位'],
      cost: ['费用', '水费', '成本', 'Cost'],
      facility: ['设施', '区域', '位置', 'Facility', 'Location']
    },
    valueTransforms: {
      waterType: { '新鲜水': 'fresh', '自来水': 'fresh', '循环水': 'recycled', '再生水': 'reclaimed', '雨水': 'rainwater' },
      source: { '市政': 'municipal', '地下水': 'groundwater', '地表水': 'surface', '海水': 'seawater' }
    }
  },

  // 废水排放 - E2.1
  waste_water_records: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'dischargeType', label: '排放类型', required: true },
      { key: 'pollutantType', label: '污染物类型' },
      { key: 'concentration', label: '浓度', type: 'number' },
      { key: 'concentrationUnit', label: '浓度单位' },
      { key: 'volume', label: '排放量', required: true, type: 'number' },
      { key: 'volumeUnit', label: '排放量单位' },
      { key: 'standardLimit', label: '标准限值', type: 'number' },
      { key: 'isCompliant', label: '是否达标', type: 'boolean' },
      { key: 'treatmentMethod', label: '处理方式' },
      { key: 'permitNo', label: '许可证号' },
      { key: 'facility', label: '设施' }
    ],
    aliases: {
      period: ['周期', '时间', 'Period', '统计周期'],
      dischargeType: ['排放类型', '废水类型', '类型', 'Type', 'discharge_type'],
      pollutantType: ['污染物类型', '污染物', '指标', 'Pollutant', 'pollutant_type'],
      concentration: ['浓度', '污染物浓度', 'Concentration', '含量'],
      concentrationUnit: ['浓度单位', '单位', 'Unit'],
      volume: ['排放量', '废水量', '排水量', 'Volume', 'Discharge'],
      volumeUnit: ['排放量单位', '单位', 'Unit'],
      standardLimit: ['标准限值', '排放标准', '限值', 'Standard', 'Limit'],
      isCompliant: ['是否达标', '达标情况', '合规', 'Compliant', '达标'],
      treatmentMethod: ['处理方式', '处理方法', '处理工艺', 'Treatment'],
      permitNo: ['许可证号', '排放许可证', '许可证', 'Permit'],
      facility: ['设施', '排放口', 'Facility', '监测点']
    },
    valueTransforms: {
      dischargeType: { '工业废水': 'industrial', '生活污水': 'domestic', '冷却水': 'cooling' },
      pollutantType: { 'COD': 'COD', 'BOD': 'BOD', '氨氮': 'ammonia_nitrogen', '总磷': 'total_phosphorus', '重金属': 'heavy_metals' },
      isCompliant: { '是': true, '否': false, '达标': true, '超标': false, 'Y': true, 'N': false }
    }
  },

  // 废气排放 - E2.2
  air_emission_records: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'emissionSource', label: '排放源', required: true },
      { key: 'pollutantType', label: '污染物类型', required: true },
      { key: 'concentration', label: '浓度', type: 'number' },
      { key: 'concentrationUnit', label: '浓度单位' },
      { key: 'emissionRate', label: '排放速率', type: 'number' },
      { key: 'totalEmission', label: '总排放量', type: 'number' },
      { key: 'standardLimit', label: '标准限值', type: 'number' },
      { key: 'isCompliant', label: '是否达标', type: 'boolean' },
      { key: 'treatmentFacility', label: '处理设施' },
      { key: 'permitNo', label: '许可证号' },
      { key: 'facility', label: '设施' }
    ],
    aliases: {
      period: ['周期', '时间', 'Period', '统计周期'],
      emissionSource: ['排放源', '废气来源', '排放设施', 'Source'],
      pollutantType: ['污染物类型', '污染物', '指标', 'Pollutant'],
      concentration: ['浓度', '污染物浓度', 'Concentration'],
      concentrationUnit: ['浓度单位', '单位', 'Unit'],
      emissionRate: ['排放速率', '排放率', 'Rate', '速率'],
      totalEmission: ['总排放量', '排放总量', '排放量', 'Emission', 'Total'],
      standardLimit: ['标准限值', '排放标准', '限值', 'Standard'],
      isCompliant: ['是否达标', '达标情况', 'Compliant', '达标'],
      treatmentFacility: ['处理设施', '治理设施', '净化设施', 'Treatment'],
      permitNo: ['许可证号', '排放许可证', 'Permit'],
      facility: ['设施', '排放口', 'Facility']
    },
    valueTransforms: {
      emissionSource: { '锅炉': 'boiler', '炉窑': 'furnace', '车辆': 'vehicle', '工艺': 'process' },
      pollutantType: { '二氧化硫': 'SO2', 'SO2': 'SO2', '氮氧化物': 'NOx', 'NOx': 'NOx', '颗粒物': 'PM', 'PM': 'PM', 'VOCs': 'VOCs', '粉尘': 'dust' },
      isCompliant: { '是': true, '否': false, '达标': true, '超标': false }
    }
  },

  // 物料消耗 - E3.3
  material_consumption: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'materialCategory', label: '物料类别', required: true },
      { key: 'materialName', label: '物料名称', required: true },
      { key: 'materialCode', label: '物料编码' },
      { key: 'quantity', label: '消耗量', required: true, type: 'number' },
      { key: 'unit', label: '单位', required: true },
      { key: 'cost', label: '成本', type: 'number' },
      { key: 'isRenewable', label: '是否可再生', type: 'boolean' },
      { key: 'isRecycled', label: '是否回收材料', type: 'boolean' },
      { key: 'recycledRatio', label: '回收成分占比', type: 'number' },
      { key: 'supplier', label: '供应商' },
      { key: 'facility', label: '设施' }
    ],
    aliases: {
      period: ['周期', '时间', 'Period', '统计周期'],
      materialCategory: ['物料类别', '类别', '分类', 'Category'],
      materialName: ['物料名称', '名称', '物料', 'Name', 'Material'],
      materialCode: ['物料编码', '编码', '物料号', 'Code'],
      quantity: ['消耗量', '用量', '数量', 'Quantity', 'Consumption'],
      unit: ['单位', 'Unit', '计量单位'],
      cost: ['成本', '费用', '金额', 'Cost'],
      isRenewable: ['是否可再生', '可再生', 'Renewable', '可再生材料'],
      isRecycled: ['是否回收材料', '回收材料', '再生材料', 'Recycled'],
      recycledRatio: ['回收成分占比', '回收占比', '再生比例', 'Recycled_Ratio'],
      supplier: ['供应商', 'Supplier', '来源'],
      facility: ['设施', '工厂', 'Facility']
    },
    valueTransforms: {
      materialCategory: { '原材料': 'raw_material', '包装材料': 'packaging', '辅料': 'auxiliary' },
      isRenewable: { '是': true, '否': false, 'Y': true, 'N': false },
      isRecycled: { '是': true, '否': false, 'Y': true, 'N': false }
    }
  },

  // 噪声监测 - E2.5
  noise_records: {
    fields: [
      { key: 'recordDate', label: '监测日期', required: true },
      { key: 'location', label: '监测点位', required: true },
      { key: 'locationType', label: '点位类型' },
      { key: 'monitoringTime', label: '监测时段' },
      { key: 'decibelLevel', label: '噪声值', required: true, type: 'number' },
      { key: 'standardLimit', label: '标准限值', type: 'number' },
      { key: 'isCompliant', label: '是否达标', type: 'boolean' },
      { key: 'noiseSource', label: '噪声源' },
      { key: 'controlMeasures', label: '控制措施' }
    ],
    aliases: {
      recordDate: ['监测日期', '日期', '时间', 'Date', 'record_date'],
      location: ['监测点位', '点位', '位置', 'Location', '监测点'],
      locationType: ['点位类型', '类型', 'Type', 'location_type'],
      monitoringTime: ['监测时段', '时段', '昼夜', 'Time'],
      decibelLevel: ['噪声值', '分贝', '噪声', 'Decibel', 'dB'],
      standardLimit: ['标准限值', '限值', '标准', 'Limit'],
      isCompliant: ['是否达标', '达标', 'Compliant'],
      noiseSource: ['噪声源', '来源', 'Source'],
      controlMeasures: ['控制措施', '降噪措施', 'Measures']
    },
    valueTransforms: {
      locationType: { '厂界': 'boundary', '车间': 'workshop', '居民区': 'residential' },
      monitoringTime: { '昼间': 'day', '夜间': 'night', '白天': 'day', '晚上': 'night' },
      isCompliant: { '是': true, '否': false, '达标': true, '超标': false }
    }
  },

  // 员工工时 - S1.2.3
  employee_work_time: {
    fields: [
      { key: 'employeeNo', label: '员工工号' },
      { key: 'period', label: '周期', required: true },
      { key: 'regularHours', label: '正常工时', required: true, type: 'number' },
      { key: 'overtimeHours', label: '加班工时', type: 'number' },
      { key: 'overtimeCompensation', label: '加班补偿方式' },
      { key: 'paidLeaveDays', label: '带薪假天数', type: 'number' },
      { key: 'sickLeaveDays', label: '病假天数', type: 'number' },
      { key: 'maternityLeaveDays', label: '产假天数', type: 'number' },
      { key: 'paternityLeaveDays', label: '陪产假天数', type: 'number' },
      { key: 'annualLeaveDays', label: '年假天数', type: 'number' }
    ],
    aliases: {
      employeeNo: ['员工工号', '工号', 'EmpNo', 'employee_no'],
      period: ['周期', '月份', '时间', 'Period', 'Month'],
      regularHours: ['正常工时', '标准工时', '工时', 'Regular_Hours', 'Hours'],
      overtimeHours: ['加班工时', '加班时长', '加班', 'Overtime', 'overtime_hours'],
      overtimeCompensation: ['加班补偿方式', '补偿方式', 'Compensation'],
      paidLeaveDays: ['带薪假天数', '带薪假', 'Paid_Leave'],
      sickLeaveDays: ['病假天数', '病假', 'Sick_Leave'],
      maternityLeaveDays: ['产假天数', '产假', 'Maternity_Leave'],
      paternityLeaveDays: ['陪产假天数', '陪产假', 'Paternity_Leave'],
      annualLeaveDays: ['年假天数', '年假', 'Annual_Leave']
    },
    valueTransforms: {
      overtimeCompensation: { '调休': 'timeoff', '加班费': 'paid', '支付': 'paid' }
    }
  },

  // 薪酬数据 - S1.2.2
  salary_records: {
    fields: [
      { key: 'employeeNo', label: '员工工号' },
      { key: 'period', label: '周期', required: true },
      { key: 'baseSalary', label: '基本工资', required: true, type: 'number' },
      { key: 'bonus', label: '奖金', type: 'number' },
      { key: 'allowance', label: '津贴', type: 'number' },
      { key: 'overtimePay', label: '加班费', type: 'number' },
      { key: 'totalCompensation', label: '总薪酬', type: 'number' },
      { key: 'socialInsurance', label: '社保', type: 'number' },
      { key: 'housingFund', label: '公积金', type: 'number' },
      { key: 'gender', label: '性别' },
      { key: 'department', label: '部门' },
      { key: 'position', label: '职位' }
    ],
    aliases: {
      employeeNo: ['员工工号', '工号', 'EmpNo', 'employee_no'],
      period: ['周期', '月份', '时间', 'Period', 'Month'],
      baseSalary: ['基本工资', '底薪', '基薪', 'Base_Salary', 'Salary'],
      bonus: ['奖金', '绩效奖金', 'Bonus'],
      allowance: ['津贴', '补贴', 'Allowance'],
      overtimePay: ['加班费', '加班工资', 'Overtime_Pay'],
      totalCompensation: ['总薪酬', '合计', '总计', 'Total'],
      socialInsurance: ['社保', '社会保险', '五险', 'Social_Insurance'],
      housingFund: ['公积金', '住房公积金', 'Housing_Fund'],
      gender: ['性别', 'Gender'],
      department: ['部门', 'Department'],
      position: ['职位', 'Position']
    },
    valueTransforms: {
      gender: { '男': 'male', '女': 'female', 'M': 'male', 'F': 'female' }
    }
  },

  // 董事会成员 - G1.2
  board_members: {
    fields: [
      { key: 'name', label: '姓名', required: true },
      { key: 'gender', label: '性别' },
      { key: 'birthYear', label: '出生年份', type: 'number' },
      { key: 'nationality', label: '国籍' },
      { key: 'education', label: '学历' },
      { key: 'position', label: '职位', required: true },
      { key: 'isIndependent', label: '是否独立董事', type: 'boolean' },
      { key: 'isExecutive', label: '是否执行董事', type: 'boolean' },
      { key: 'appointmentDate', label: '任命日期' },
      { key: 'termEndDate', label: '任期结束日期' },
      { key: 'tenure', label: '任期', type: 'number' },
      { key: 'otherPositions', label: '兼任职务' },
      { key: 'attendanceRate', label: '出席率', type: 'number' },
      { key: 'expertise', label: '专业领域' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      name: ['姓名', '名称', 'Name', '董事姓名'],
      gender: ['性别', 'Gender', 'Sex'],
      birthYear: ['出生年份', '出生年', 'Birth_Year', '年龄'],
      nationality: ['国籍', '国家', 'Nationality'],
      education: ['学历', '最高学历', 'Education'],
      position: ['职位', '职务', 'Position', '董事类型'],
      isIndependent: ['是否独立董事', '独立董事', 'Independent', '独董'],
      isExecutive: ['是否执行董事', '执行董事', 'Executive'],
      appointmentDate: ['任命日期', '就任日期', '任职日期', 'Appointment_Date'],
      termEndDate: ['任期结束日期', '届满日期', 'Term_End'],
      tenure: ['任期', '任职年限', 'Tenure'],
      otherPositions: ['兼任职务', '其他职务', 'Other_Positions'],
      attendanceRate: ['出席率', '出勤率', 'Attendance'],
      expertise: ['专业领域', '专业', 'Expertise'],
      status: ['状态', 'Status', '任职状态']
    },
    valueTransforms: {
      gender: { '男': 'male', '女': 'female', 'M': 'male', 'F': 'female' },
      isIndependent: { '是': true, '否': false, 'Y': true, 'N': false },
      isExecutive: { '是': true, '否': false, 'Y': true, 'N': false },
      position: { '董事长': 'chairman', '副董事长': 'vice_chairman', '董事': 'director' },
      status: { '在任': 'active', '离任': 'resigned', '退休': 'retired' },
      education: { '博士': 'phd', '硕士': 'master', '本科': 'bachelor' }
    }
  },

  // 监事会成员 - G1.3
  supervisors: {
    fields: [
      { key: 'name', label: '姓名', required: true },
      { key: 'gender', label: '性别' },
      { key: 'birthYear', label: '出生年份', type: 'number' },
      { key: 'education', label: '学历' },
      { key: 'position', label: '职位', required: true },
      { key: 'isExternal', label: '是否外部监事', type: 'boolean' },
      { key: 'isEmployeeRep', label: '是否职工代表', type: 'boolean' },
      { key: 'appointmentDate', label: '任命日期' },
      { key: 'termEndDate', label: '任期结束日期' },
      { key: 'tenure', label: '任期', type: 'number' },
      { key: 'attendanceRate', label: '出席率', type: 'number' },
      { key: 'questionsRaised', label: '质询提议次数', type: 'number' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      name: ['姓名', '名称', 'Name', '监事姓名'],
      gender: ['性别', 'Gender'],
      birthYear: ['出生年份', 'Birth_Year'],
      education: ['学历', 'Education'],
      position: ['职位', 'Position', '监事类型'],
      isExternal: ['是否外部监事', '外部监事', 'External'],
      isEmployeeRep: ['是否职工代表', '职工代表监事', 'Employee_Rep'],
      appointmentDate: ['任命日期', '就任日期', 'Appointment_Date'],
      termEndDate: ['任期结束日期', 'Term_End'],
      tenure: ['任期', 'Tenure'],
      attendanceRate: ['出席率', 'Attendance'],
      questionsRaised: ['质询提议次数', '提议次数', 'Questions'],
      status: ['状态', 'Status']
    },
    valueTransforms: {
      gender: { '男': 'male', '女': 'female' },
      isExternal: { '是': true, '否': false, 'Y': true, 'N': false },
      isEmployeeRep: { '是': true, '否': false, 'Y': true, 'N': false },
      position: { '监事会主席': 'chairman', '监事': 'supervisor' },
      status: { '在任': 'active', '离任': 'resigned' }
    }
  },

  // 高管信息 - G1.4
  executives: {
    fields: [
      { key: 'name', label: '姓名', required: true },
      { key: 'gender', label: '性别' },
      { key: 'birthYear', label: '出生年份', type: 'number' },
      { key: 'education', label: '学历' },
      { key: 'position', label: '职位', required: true },
      { key: 'appointmentDate', label: '任命日期' },
      { key: 'tenure', label: '任期', type: 'number' },
      { key: 'annualSalary', label: '年薪', type: 'number' },
      { key: 'bonus', label: '奖金', type: 'number' },
      { key: 'equity', label: '股权激励价值', type: 'number' },
      { key: 'shareholding', label: '持股数量', type: 'number' },
      { key: 'shareholdingRatio', label: '持股比例', type: 'number' },
      { key: 'performanceRating', label: '绩效评级' },
      { key: 'trainingHours', label: '培训时长', type: 'number' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      name: ['姓名', '名称', 'Name', '高管姓名'],
      gender: ['性别', 'Gender'],
      birthYear: ['出生年份', 'Birth_Year'],
      education: ['学历', 'Education'],
      position: ['职位', 'Position', '职务'],
      appointmentDate: ['任命日期', 'Appointment_Date'],
      tenure: ['任期', 'Tenure'],
      annualSalary: ['年薪', '薪酬', '工资', 'Salary', 'Annual_Salary'],
      bonus: ['奖金', 'Bonus'],
      equity: ['股权激励价值', '股权激励', 'Equity'],
      shareholding: ['持股数量', '持股', 'Shareholding'],
      shareholdingRatio: ['持股比例', 'Shareholding_Ratio'],
      performanceRating: ['绩效评级', '绩效', 'Performance'],
      trainingHours: ['培训时长', '培训小时', 'Training_Hours'],
      status: ['状态', 'Status']
    },
    valueTransforms: {
      gender: { '男': 'male', '女': 'female' },
      status: { '在任': 'active', '离任': 'resigned' },
      education: { '博士': 'phd', '硕士': 'master', '本科': 'bachelor' }
    }
  },

  // 股东信息 - G1.1
  shareholders: {
    fields: [
      { key: 'name', label: '股东名称', required: true },
      { key: 'shareholderType', label: '股东类型' },
      { key: 'shareType', label: '股份类型' },
      { key: 'shareCount', label: '持股数量', type: 'number' },
      { key: 'shareRatio', label: '持股比例', type: 'number' },
      { key: 'votingRights', label: '投票权比例', type: 'number' },
      { key: 'isPledged', label: '是否质押', type: 'boolean' },
      { key: 'pledgeRatio', label: '质押比例', type: 'number' },
      { key: 'isFrozen', label: '是否冻结', type: 'boolean' },
      { key: 'isRelatedParty', label: '是否关联方', type: 'boolean' },
      { key: 'registrationDate', label: '登记日期' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      name: ['股东名称', '名称', 'Name', '股东'],
      shareholderType: ['股东类型', '类型', 'Type'],
      shareType: ['股份类型', '股份', 'Share_Type'],
      shareCount: ['持股数量', '持股数', '股数', 'Share_Count'],
      shareRatio: ['持股比例', '占比', 'Share_Ratio', '比例'],
      votingRights: ['投票权比例', '投票权', 'Voting_Rights'],
      isPledged: ['是否质押', '质押', 'Pledged'],
      pledgeRatio: ['质押比例', 'Pledge_Ratio'],
      isFrozen: ['是否冻结', '冻结', 'Frozen'],
      isRelatedParty: ['是否关联方', '关联方', 'Related_Party'],
      registrationDate: ['登记日期', '日期', 'Registration_Date'],
      status: ['状态', 'Status']
    },
    valueTransforms: {
      shareholderType: { '个人': 'individual', '机构': 'institution', '国有': 'state', '外资': 'foreign' },
      shareType: { '普通股': 'common', '优先股': 'preferred' },
      isPledged: { '是': true, '否': false, 'Y': true, 'N': false },
      isFrozen: { '是': true, '否': false },
      isRelatedParty: { '是': true, '否': false },
      status: { '正常': 'active', '已退出': 'exited' }
    }
  },

  // 研发投入 - S2.2.3
  rd_investment: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'projectName', label: '项目名称' },
      { key: 'projectCategory', label: '项目类别' },
      { key: 'investmentAmount', label: '投入金额', required: true, type: 'number' },
      { key: 'isGreen', label: '是否绿色研发', type: 'boolean' },
      { key: 'personnelCount', label: '研发人员数', type: 'number' },
      { key: 'personnelCost', label: '人员费用', type: 'number' },
      { key: 'equipmentCost', label: '设备费用', type: 'number' },
      { key: 'materialCost', label: '材料费用', type: 'number' },
      { key: 'department', label: '部门' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      period: ['周期', '年份', 'Period', 'Year'],
      projectName: ['项目名称', '项目', 'Project', 'Name'],
      projectCategory: ['项目类别', '类别', 'Category'],
      investmentAmount: ['投入金额', '研发投入', '金额', 'Investment', 'Amount'],
      isGreen: ['是否绿色研发', '绿色研发', 'Green', 'Is_Green'],
      personnelCount: ['研发人员数', '人数', 'Personnel_Count'],
      personnelCost: ['人员费用', '人工费', 'Personnel_Cost'],
      equipmentCost: ['设备费用', '设备费', 'Equipment_Cost'],
      materialCost: ['材料费用', '材料费', 'Material_Cost'],
      department: ['部门', 'Department'],
      status: ['状态', 'Status']
    },
    valueTransforms: {
      projectCategory: { '基础研究': 'basic_research', '应用研究': 'applied_research', '开发': 'development' },
      isGreen: { '是': true, '否': false, 'Y': true, 'N': false },
      status: { '进行中': 'active', '已完成': 'completed', '暂停': 'suspended' }
    }
  },

  // 专利数据 - S2.2.3
  patents: {
    fields: [
      { key: 'patentNo', label: '专利号', required: true },
      { key: 'patentName', label: '专利名称', required: true },
      { key: 'patentType', label: '专利类型', required: true },
      { key: 'applicationDate', label: '申请日期' },
      { key: 'grantDate', label: '授权日期' },
      { key: 'expiryDate', label: '到期日期' },
      { key: 'inventors', label: '发明人' },
      { key: 'isGreen', label: '是否绿色专利', type: 'boolean' },
      { key: 'status', label: '状态' },
      { key: 'annualFee', label: '年费', type: 'number' }
    ],
    aliases: {
      patentNo: ['专利号', '专利编号', 'Patent_No', 'Patent_Number'],
      patentName: ['专利名称', '名称', 'Patent_Name', 'Name'],
      patentType: ['专利类型', '类型', 'Patent_Type', 'Type'],
      applicationDate: ['申请日期', '申请时间', 'Application_Date'],
      grantDate: ['授权日期', '授权时间', 'Grant_Date'],
      expiryDate: ['到期日期', '有效期至', 'Expiry_Date'],
      inventors: ['发明人', '发明者', 'Inventors'],
      isGreen: ['是否绿色专利', '绿色专利', 'Green', 'Is_Green'],
      status: ['状态', 'Status', '专利状态'],
      annualFee: ['年费', '维护费', 'Annual_Fee']
    },
    valueTransforms: {
      patentType: { '发明': 'invention', '发明专利': 'invention', '实用新型': 'utility_model', '外观设计': 'design' },
      isGreen: { '是': true, '否': false },
      status: { '申请中': 'pending', '已授权': 'granted', '已过期': 'expired', '已放弃': 'abandoned' }
    }
  },

  // 产品质量事件 - S2.2.2
  product_incidents: {
    fields: [
      { key: 'incidentNo', label: '事件编号', required: true },
      { key: 'incidentDate', label: '事件日期', required: true },
      { key: 'incidentType', label: '事件类型', required: true },
      { key: 'productName', label: '产品名称', required: true },
      { key: 'productBatch', label: '产品批次' },
      { key: 'affectedQuantity', label: '影响数量', type: 'number' },
      { key: 'description', label: '描述' },
      { key: 'rootCause', label: '根本原因' },
      { key: 'correctiveAction', label: '纠正措施' },
      { key: 'compensationAmount', label: '赔偿金额', type: 'number' },
      { key: 'resolution', label: '处理结果' },
      { key: 'resolutionDate', label: '处理日期' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      incidentNo: ['事件编号', '编号', 'Incident_No', 'Case_No'],
      incidentDate: ['事件日期', '日期', 'Incident_Date', 'Date'],
      incidentType: ['事件类型', '类型', 'Incident_Type', 'Type'],
      productName: ['产品名称', '产品', 'Product_Name', 'Product'],
      productBatch: ['产品批次', '批次', 'Batch'],
      affectedQuantity: ['影响数量', '数量', 'Affected_Quantity', 'Quantity'],
      description: ['描述', '详情', 'Description'],
      rootCause: ['根本原因', '原因', 'Root_Cause'],
      correctiveAction: ['纠正措施', '措施', 'Corrective_Action'],
      compensationAmount: ['赔偿金额', '赔偿', 'Compensation'],
      resolution: ['处理结果', '结果', 'Resolution'],
      resolutionDate: ['处理日期', 'Resolution_Date'],
      status: ['状态', 'Status']
    },
    valueTransforms: {
      incidentType: { '召回': 'recall', '投诉': 'complaint', '质量问题': 'quality_issue', '安全问题': 'safety_issue' },
      status: { '处理中': 'open', '调查中': 'investigating', '已解决': 'resolved', '已关闭': 'closed' }
    }
  },

  // 环保投资 - E4.2.1
  environment_investments: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'investmentCategory', label: '投资类别', required: true },
      { key: 'projectName', label: '项目名称' },
      { key: 'investmentAmount', label: '投资金额', required: true, type: 'number' },
      { key: 'expectedEffect', label: '预期效果' },
      { key: 'actualEffect', label: '实际效果' },
      { key: 'startDate', label: '开始日期' },
      { key: 'completionDate', label: '完成日期' },
      { key: 'status', label: '状态' },
      { key: 'facility', label: '设施' }
    ],
    aliases: {
      period: ['周期', '年份', 'Period', 'Year'],
      investmentCategory: ['投资类别', '类别', 'Category', 'Investment_Category'],
      projectName: ['项目名称', '项目', 'Project', 'Name'],
      investmentAmount: ['投资金额', '金额', '投入', 'Investment', 'Amount'],
      expectedEffect: ['预期效果', '预期', 'Expected_Effect'],
      actualEffect: ['实际效果', '实际', 'Actual_Effect'],
      startDate: ['开始日期', '开始时间', 'Start_Date'],
      completionDate: ['完成日期', '完工日期', 'Completion_Date'],
      status: ['状态', 'Status'],
      facility: ['设施', '工厂', 'Facility']
    },
    valueTransforms: {
      investmentCategory: { '环保设施': 'facility', '污染物减排': 'emission_reduction', '环境责任保险': 'insurance', '绿色研发': 'green_rd', '生态保护': 'ecological', '生物多样性': 'biodiversity' },
      status: { '计划中': 'planned', '进行中': 'in_progress', '已完成': 'completed' }
    }
  },

  // 公司财务数据 - 用于计算强度指标分母
  company_financials: {
    fields: [
      { key: 'period', label: '周期', required: true },
      { key: 'revenue', label: '营业收入', type: 'number' },
      { key: 'netProfit', label: '净利润', type: 'number' },
      { key: 'totalAssets', label: '总资产', type: 'number' },
      { key: 'productionOutput', label: '产量', type: 'number' },
      { key: 'productionUnit', label: '产量单位' },
      { key: 'employeeCount', label: '员工人数', type: 'number' },
      { key: 'avgEmployeeCount', label: '平均员工人数', type: 'number' },
      { key: 'operatingArea', label: '运营面积', type: 'number' },
      { key: 'currency', label: '货币' }
    ],
    aliases: {
      period: ['周期', '年份', 'Period', 'Year', '财年'],
      revenue: ['营业收入', '收入', '营收', 'Revenue', 'Sales'],
      netProfit: ['净利润', '利润', 'Net_Profit', 'Profit'],
      totalAssets: ['总资产', '资产', 'Total_Assets', 'Assets'],
      productionOutput: ['产量', '产出', '产能', 'Production', 'Output'],
      productionUnit: ['产量单位', '单位', 'Production_Unit'],
      employeeCount: ['员工人数', '员工数', '人数', 'Employee_Count', 'Headcount'],
      avgEmployeeCount: ['平均员工人数', '平均人数', 'Avg_Employee_Count'],
      operatingArea: ['运营面积', '面积', 'Operating_Area', 'Area'],
      currency: ['货币', '币种', 'Currency']
    },
    valueTransforms: {}
  },

  // 会议记录 - G1 治理结构
  meeting_records: {
    fields: [
      { key: 'meetingType', label: '会议类型', required: true },
      { key: 'meetingNo', label: '会议编号' },
      { key: 'meetingDate', label: '会议日期', required: true },
      { key: 'meetingName', label: '会议名称' },
      { key: 'attendeesCount', label: '出席人数', type: 'number' },
      { key: 'totalMembers', label: '应出席人数', type: 'number' },
      { key: 'attendanceRate', label: '出席率', type: 'number' },
      { key: 'resolutionsCount', label: '审议议案数', type: 'number' },
      { key: 'approvedCount', label: '通过议案数', type: 'number' },
      { key: 'keyResolutions', label: '重要决议' },
      { key: 'minutes', label: '会议纪要' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      meetingType: ['会议类型', '类型', 'Meeting_Type', 'Type'],
      meetingNo: ['会议编号', '编号', 'Meeting_No'],
      meetingDate: ['会议日期', '日期', 'Meeting_Date', 'Date'],
      meetingName: ['会议名称', '名称', 'Meeting_Name', 'Name'],
      attendeesCount: ['出席人数', '出席', 'Attendees'],
      totalMembers: ['应出席人数', '应到', 'Total_Members'],
      attendanceRate: ['出席率', 'Attendance_Rate', 'Attendance'],
      resolutionsCount: ['审议议案数', '议案数', 'Resolutions'],
      approvedCount: ['通过议案数', '通过数', 'Approved'],
      keyResolutions: ['重要决议', '决议', 'Key_Resolutions'],
      minutes: ['会议纪要', '纪要', 'Minutes'],
      status: ['状态', 'Status']
    },
    valueTransforms: {
      meetingType: { '股东大会': 'shareholder', '董事会': 'board', '监事会': 'supervisor', '专门委员会': 'committee' },
      status: { '已完成': 'completed', '已取消': 'cancelled' }
    }
  },

  // 认证许可 - 各类认证
  certifications: {
    fields: [
      { key: 'certType', label: '认证类型', required: true },
      { key: 'certName', label: '证书名称', required: true },
      { key: 'certNo', label: '证书编号' },
      { key: 'issuer', label: '发证机构' },
      { key: 'issueDate', label: '发证日期' },
      { key: 'expiryDate', label: '到期日期' },
      { key: 'scope', label: '认证范围' },
      { key: 'level', label: '认证等级' },
      { key: 'facility', label: '设施' },
      { key: 'status', label: '状态' }
    ],
    aliases: {
      certType: ['认证类型', '类型', 'Cert_Type', 'Type'],
      certName: ['证书名称', '名称', '认证名称', 'Cert_Name', 'Name'],
      certNo: ['证书编号', '编号', 'Cert_No', 'Number'],
      issuer: ['发证机构', '机构', '颁发机构', 'Issuer'],
      issueDate: ['发证日期', '颁发日期', 'Issue_Date'],
      expiryDate: ['到期日期', '有效期至', 'Expiry_Date'],
      scope: ['认证范围', '范围', 'Scope'],
      level: ['认证等级', '等级', '级别', 'Level'],
      facility: ['设施', '工厂', 'Facility'],
      status: ['状态', 'Status']
    },
    valueTransforms: {
      certType: { '环保许可': 'environmental', '质量认证': 'quality', '安全认证': 'safety', 'ESG认证': 'esg' },
      status: { '有效': 'valid', '已过期': 'expired', '暂停': 'suspended', '撤销': 'revoked' }
    }
  }
}

// 数据源元数据配置（用于前端显示）
export const dataSourceMeta: Record<string, {
  name: string
  nameEn: string
  description: string
  category: 'E' | 'S' | 'G' | 'common'
  relatedMetrics: string[] // 相关指标编码前缀
}> = {
  employees: { name: '员工数据', nameEn: 'Employees', description: '员工基本信息、入职离职记录', category: 'S', relatedMetrics: ['S1.1', 'S1.2'] },
  energy_consumption: { name: '能源消耗', nameEn: 'Energy Consumption', description: '各类能源使用量和费用', category: 'E', relatedMetrics: ['E3.2'] },
  carbon_emissions: { name: '碳排放', nameEn: 'Carbon Emissions', description: '温室气体排放数据（范围1/2/3）', category: 'E', relatedMetrics: ['E1.1', 'E1.2'] },
  waste_data: { name: '废弃物', nameEn: 'Waste Data', description: '固体废弃物产生和处置', category: 'E', relatedMetrics: ['E2.3', 'E2.4'] },
  suppliers: { name: '供应商', nameEn: 'Suppliers', description: '供应商信息和ESG评级', category: 'S', relatedMetrics: ['S2.1'] },
  training_records: { name: '培训记录', nameEn: 'Training Records', description: '员工培训数据', category: 'S', relatedMetrics: ['S1.2.4', 'S1.4'] },
  safety_incidents: { name: '安全事故', nameEn: 'Safety Incidents', description: '工伤事故和安全事件', category: 'S', relatedMetrics: ['S1.2.4'] },
  donations: { name: '公益捐赠', nameEn: 'Donations', description: '慈善捐赠和志愿服务', category: 'S', relatedMetrics: ['S3.1', 'S3.2'] },
  water_consumption: { name: '水资源消耗', nameEn: 'Water Consumption', description: '用水量（新鲜水/循环水）', category: 'E', relatedMetrics: ['E3.1'] },
  waste_water_records: { name: '废水排放', nameEn: 'Waste Water', description: '废水排放量和污染物浓度', category: 'E', relatedMetrics: ['E2.1'] },
  air_emission_records: { name: '废气排放', nameEn: 'Air Emissions', description: '废气排放量和污染物浓度', category: 'E', relatedMetrics: ['E2.2'] },
  material_consumption: { name: '物料消耗', nameEn: 'Material Consumption', description: '原材料和包装材料使用', category: 'E', relatedMetrics: ['E3.3'] },
  noise_records: { name: '噪声监测', nameEn: 'Noise Records', description: '噪声监测数据', category: 'E', relatedMetrics: ['E2.5'] },
  employee_work_time: { name: '员工工时', nameEn: 'Work Time', description: '工时、加班、休假记录', category: 'S', relatedMetrics: ['S1.2.3'] },
  salary_records: { name: '薪酬数据', nameEn: 'Salary Records', description: '工资、奖金、福利数据', category: 'S', relatedMetrics: ['S1.2.2'] },
  board_members: { name: '董事会成员', nameEn: 'Board Members', description: '董事会构成和履职情况', category: 'G', relatedMetrics: ['G1.2'] },
  supervisors: { name: '监事会成员', nameEn: 'Supervisors', description: '监事会构成和履职情况', category: 'G', relatedMetrics: ['G1.3'] },
  executives: { name: '高管信息', nameEn: 'Executives', description: '高管构成、薪酬、持股', category: 'G', relatedMetrics: ['G1.4'] },
  shareholders: { name: '股东信息', nameEn: 'Shareholders', description: '股东构成和持股情况', category: 'G', relatedMetrics: ['G1.1'] },
  rd_investment: { name: '研发投入', nameEn: 'R&D Investment', description: '研发项目投入和人员', category: 'S', relatedMetrics: ['S2.2.3'] },
  patents: { name: '专利数据', nameEn: 'Patents', description: '专利申请和授权情况', category: 'S', relatedMetrics: ['S2.2.3'] },
  product_incidents: { name: '产品质量事件', nameEn: 'Product Incidents', description: '产品召回、投诉事件', category: 'S', relatedMetrics: ['S2.2.2'] },
  environment_investments: { name: '环保投资', nameEn: 'Environment Investments', description: '环保设施和项目投资', category: 'E', relatedMetrics: ['E4.2'] },
  company_financials: { name: '公司财务', nameEn: 'Company Financials', description: '营收、利润等财务数据', category: 'common', relatedMetrics: [] },
  meeting_records: { name: '会议记录', nameEn: 'Meeting Records', description: '股东大会、董事会等会议', category: 'G', relatedMetrics: ['G1.1', 'G1.2', 'G1.3'] },
  certifications: { name: '认证许可', nameEn: 'Certifications', description: '环保/质量/安全认证', category: 'common', relatedMetrics: ['E2.1', 'E2.2', 'S2.2'] }
}

/**
 * 计算两个字符串的相似度 (0-1)
 * 使用 Levenshtein 距离
 */
export function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase())
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1] ?? 0
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j] ?? 0) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length] ?? 0
}

/**
 * 智能匹配源字段到目标字段
 */
export function autoMatchFields(
  sourceFields: string[],
  dataSource: string
): Record<string, { targetField: string; confidence: number; method: string }> {
  const config = dataSourceFields[dataSource]
  if (!config) return {}

  const result: Record<string, { targetField: string; confidence: number; method: string }> = {}

  for (const sourceField of sourceFields) {
    let bestMatch = { targetField: '', confidence: 0, method: '' }

    // 1. 精确匹配别名
    for (const [targetField, aliases] of Object.entries(config.aliases)) {
      if (aliases.some(alias => alias.toLowerCase() === sourceField.toLowerCase())) {
        bestMatch = { targetField, confidence: 1.0, method: 'alias_exact' }
        break
      }
    }

    // 2. 别名包含匹配
    if (bestMatch.confidence < 1.0) {
      for (const [targetField, aliases] of Object.entries(config.aliases)) {
        for (const alias of aliases) {
          if (sourceField.toLowerCase().includes(alias.toLowerCase()) ||
            alias.toLowerCase().includes(sourceField.toLowerCase())) {
            const similarity = stringSimilarity(sourceField, alias)
            if (similarity > bestMatch.confidence) {
              bestMatch = { targetField, confidence: Math.min(similarity + 0.1, 0.95), method: 'alias_contains' }
            }
          }
        }
      }
    }

    // 3. 字段名相似度匹配
    if (bestMatch.confidence < 0.7) {
      for (const field of config.fields) {
        const similarity = Math.max(
          stringSimilarity(sourceField, field.key),
          stringSimilarity(sourceField, field.label)
        )
        if (similarity > bestMatch.confidence) {
          bestMatch = { targetField: field.key, confidence: similarity, method: 'similarity' }
        }
      }
    }

    // 只保留置信度 > 0.4 的匹配
    if (bestMatch.confidence > 0.4) {
      result[sourceField] = bestMatch
    }
  }

  return result
}

/**
 * 应用字段映射和值转换
 */
export function applyFieldMapping(
  row: Record<string, any>,
  mapping: Record<string, string>,
  dataSource: string,
  customValueTransforms?: Record<string, Record<string, any>>
): Record<string, any> {
  const config = dataSourceFields[dataSource]
  const valueTransforms = { ...config?.valueTransforms, ...customValueTransforms }
  const result: Record<string, any> = {}

  for (const [sourceField, targetField] of Object.entries(mapping)) {
    if (!targetField || row[sourceField] === undefined || row[sourceField] === '') continue

    let value = row[sourceField]

    // 应用值转换
    if (valueTransforms[targetField]) {
      const transform = valueTransforms[targetField]
      if (transform[value] !== undefined) {
        value = transform[value]
      } else if (transform[String(value)] !== undefined) {
        value = transform[String(value)]
      }
    }

    // 类型转换
    const fieldDef = config?.fields.find(f => f.key === targetField)
    if (fieldDef?.type === 'number') {
      value = parseFloat(value) || 0
    } else if (fieldDef?.type === 'boolean') {
      if (typeof value === 'string') {
        value = ['是', 'true', '1', 'yes', 'Y', 'y'].includes(value.trim())
      }
    }

    result[targetField] = value
  }

  return result
}

export default {
  dataSourceFields,
  autoMatchFields,
  applyFieldMapping,
  stringSimilarity
}
