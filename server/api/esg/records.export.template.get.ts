import { db, esgMetrics } from '../../database'

// 数据源模板配置
const templateConfigs: Record<string, { headers: string[]; example: string[] }> = {
  employees: {
    headers: ['工号', '姓名', '性别', '出生日期', '部门', '职位', '职级', '员工类型', '是否党员', '是否工会成员', '是否残疾人', '是否少数民族', '学历', '入职日期', '离职日期', '状态'],
    example: ['EMP001', '张三', '男', '1990-01-15', '技术部', '工程师', 'senior', 'fulltime', '是', '是', '否', '否', 'bachelor', '2020-03-01', '', 'active']
  },
  energy_consumption: {
    headers: ['周期', '能源类型', '消耗量', '单位', '费用', '设施', '来源', '是否可再生', '备注'],
    example: ['2026-01', 'electricity', '50000', 'kWh', '35000', '总部大楼', 'grid', '否', '']
  },
  suppliers: {
    headers: ['编号', '名称', '类别', '地区', '国家', '是否本地', '合同金额', 'ESG评级', '是否有认证', '状态'],
    example: ['SUP001', 'XX材料公司', 'raw_material', '华东', '中国', '是', '1000000', 'B', '是', 'active']
  },
  training_records: {
    headers: ['员工工号', '培训类型', '培训名称', '培训日期', '时长(小时)', '费用', '培训机构', '是否在线', '是否通过'],
    example: ['EMP001', 'safety', '安全生产培训', '2026-01-15', '8', '500', '安全培训中心', '否', '是']
  },
  safety_incidents: {
    headers: ['事故编号', '事故日期', '事故类型', '严重程度', '地点', '描述', '受伤人数', '死亡人数', '损失工时', '直接损失', '状态'],
    example: ['INC001', '2026-01-10', 'near_miss', 'minor', '车间A', '设备故障险情', '0', '0', '0', '0', 'closed']
  },
  donations: {
    headers: ['捐赠日期', '捐赠类型', '类别', '受捐方', '金额', '志愿服务时长', '志愿者人数', '描述'],
    example: ['2026-01-20', 'cash', 'education', 'XX希望小学', '50000', '', '', '教育资助']
  },
  waste_data: {
    headers: ['周期', '废物类型', '废物名称', '数量', '单位', '处置方式', '处置单位', '是否合规'],
    example: ['2026-01', 'hazardous', '废机油', '0.5', 'ton', 'treatment', 'XX环保公司', '是']
  },
  carbon_emissions: {
    headers: ['周期', '范围', '类别', '排放源', '活动数据', '活动单位', '排放因子', '排放量(tCO2e)'],
    example: ['2026-01', '1', 'stationary_combustion', '锅炉天然气', '10000', 'm3', '2.1', '21']
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dataSource = (query.dataSource as string) || 'employees'

  const config = templateConfigs[dataSource]
  if (!config) {
    return new Response('不支持的数据源类型', { status: 400 })
  }

  // 生成CSV内容（包含表头和示例行）
  const csvLines = [
    config.headers.join(','),
    config.example.join(',')
  ]
  const csv = '\uFEFF' + csvLines.join('\n') // 添加BOM以支持中文

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${dataSource}_template.csv"`
    }
  })
})
