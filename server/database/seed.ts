/**
 * ESG 数据库初始化种子脚本
 * 运行: npx tsx server/database/seed.ts
 */

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

// 创建数据库连接
const client = createClient({
  url: 'file:./data/esg.db'
})

const db = drizzle(client, { schema })

// ESG 模块定义
const modules = [
  { code: 'E', name: '环境', description: '环境相关指标', sortOrder: 1 },
  { code: 'S', name: '社会', description: '社会相关指标', sortOrder: 2 },
  { code: 'G', name: '治理', description: '治理相关指标', sortOrder: 3 }
]

// 子模块定义
const subModules = [
  { moduleCode: 'E', code: 'E1', name: '碳排放', description: '温室气体排放相关指标', sortOrder: 1 },
  {
    moduleCode: 'E',
    code: 'E2',
    name: '污染物排放',
    description: '废水、废气、固体废物排放',
    sortOrder: 2
  },
  {
    moduleCode: 'E',
    code: 'E3',
    name: '资源消耗',
    description: '能源、水资源、原材料消耗',
    sortOrder: 3
  },
  {
    moduleCode: 'E',
    code: 'E4',
    name: '环境管理',
    description: '环境管理体系与合规',
    sortOrder: 4
  },
  { moduleCode: 'S', code: 'S1', name: '员工', description: '员工权益与发展', sortOrder: 1 },
  {
    moduleCode: 'S',
    code: 'S2',
    name: '供应链管理',
    description: '供应商ESG管理',
    sortOrder: 2
  },
  {
    moduleCode: 'S',
    code: 'S3',
    name: '社会责任',
    description: '社区与公益',
    sortOrder: 3
  },
  {
    moduleCode: 'G',
    code: 'G1',
    name: '公司治理结构',
    description: '董事会与管理层',
    sortOrder: 1
  },
  {
    moduleCode: 'G',
    code: 'G2',
    name: '公司治理机制',
    description: '内控与风险管理',
    sortOrder: 2
  }
]

// E1 碳排放分类与指标
const e1Categories = [
  {
    code: 'E1.1',
    name: '直接温室气体排放（范围1）',
    children: [
      {
        code: 'E1.1.1',
        name: '固定燃烧排放',
        metrics: [
          {
            code: 'E1.1.1.1',
            name: '煤炭燃烧排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.1.1.2',
            name: '天然气燃烧排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.1.1.3',
            name: '燃油燃烧排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.1.1.4',
            name: '其他固定源排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          }
        ]
      },
      {
        code: 'E1.1.2',
        name: '移动燃烧排放',
        metrics: [
          {
            code: 'E1.1.2.1',
            name: '公司车辆排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.1.2.2',
            name: '物流车辆排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.1.2.3',
            name: '航空差旅排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          }
        ]
      },
      {
        code: 'E1.1.3',
        name: '过程排放',
        metrics: [
          {
            code: 'E1.1.3.1',
            name: '工业过程排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.1.3.2',
            name: '化学反应排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          }
        ]
      },
      {
        code: 'E1.1.4',
        name: '逸散排放',
        metrics: [
          {
            code: 'E1.1.4.1',
            name: '制冷剂泄漏',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          { code: 'E1.1.4.2', name: 'SF6泄漏', fieldType: 'number', config: { unit: 'tCO2e' } },
          {
            code: 'E1.1.4.3',
            name: '其他逸散排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          }
        ]
      }
    ]
  },
  {
    code: 'E1.2',
    name: '间接温室气体排放（范围2）',
    children: [
      {
        code: 'E1.2.1',
        name: '外购电力排放',
        metrics: [
          {
            code: 'E1.2.1.1',
            name: '办公用电排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.2.1.2',
            name: '生产用电排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.2.1.3',
            name: '数据中心用电排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          }
        ]
      },
      {
        code: 'E1.2.2',
        name: '外购热力排放',
        metrics: [
          { code: 'E1.2.2.1', name: '供暖排放', fieldType: 'number', config: { unit: 'tCO2e' } },
          { code: 'E1.2.2.2', name: '供冷排放', fieldType: 'number', config: { unit: 'tCO2e' } }
        ]
      }
    ]
  },
  {
    code: 'E1.3',
    name: '其他间接温室气体排放（范围3）',
    children: [
      {
        code: 'E1.3.1',
        name: '上游排放',
        metrics: [
          {
            code: 'E1.3.1.1',
            name: '采购商品及服务排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.3.1.2',
            name: '资本货物排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.3.1.3',
            name: '上游运输配送排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.3.1.4',
            name: '员工通勤排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.3.1.5',
            name: '商务差旅排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          }
        ]
      },
      {
        code: 'E1.3.2',
        name: '下游排放',
        metrics: [
          {
            code: 'E1.3.2.1',
            name: '产品使用阶段排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.3.2.2',
            name: '产品报废处理排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          },
          {
            code: 'E1.3.2.3',
            name: '下游运输配送排放',
            fieldType: 'number',
            config: { unit: 'tCO2e' }
          }
        ]
      }
    ]
  },
  {
    code: 'E1.4',
    name: '碳减排措施',
    metrics: [
      { code: 'E1.4.1', name: '年度碳减排目标', fieldType: 'number', config: { unit: '%' } },
      { code: 'E1.4.2', name: '实际碳减排量', fieldType: 'number', config: { unit: 'tCO2e' } },
      { code: 'E1.4.3', name: '购买碳配额量', fieldType: 'number', config: { unit: 'tCO2e' } },
      {
        code: 'E1.4.4',
        name: '碳中和承诺年份',
        fieldType: 'select',
        config: {
          options: [
            { label: '2030年', value: '2030' },
            { label: '2040年', value: '2040' },
            { label: '2050年', value: '2050' },
            { label: '2060年', value: '2060' }
          ]
        }
      }
    ]
  }
]

// E2 污染物排放分类与指标
const e2Categories = [
  {
    code: 'E2.1',
    name: '废水排放',
    children: [
      {
        code: 'E2.1.1',
        name: '废水排放量',
        metrics: [
          { code: 'E2.1.1.1', name: '工业废水排放量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.1.1.2', name: '生活污水排放量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.1.1.3', name: '废水回用量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.1.1.4', name: '废水回用率', fieldType: 'number', config: { unit: '%' } }
        ]
      },
      {
        code: 'E2.1.2',
        name: '废水污染物',
        metrics: [
          { code: 'E2.1.2.1', name: 'COD排放量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.1.2.2', name: '氨氮排放量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.1.2.3', name: '总磷排放量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.1.2.4', name: '总氮排放量', fieldType: 'number', config: { unit: '吨' } }
        ]
      }
    ]
  },
  {
    code: 'E2.2',
    name: '废气排放',
    children: [
      {
        code: 'E2.2.1',
        name: '大气污染物',
        metrics: [
          { code: 'E2.2.1.1', name: 'SO2排放量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.2.1.2', name: 'NOx排放量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.2.1.3', name: '颗粒物排放量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.2.1.4', name: 'VOCs排放量', fieldType: 'number', config: { unit: '吨' } }
        ]
      }
    ]
  },
  {
    code: 'E2.3',
    name: '固体废物',
    children: [
      {
        code: 'E2.3.1',
        name: '一般固废',
        metrics: [
          {
            code: 'E2.3.1.1',
            name: '一般固废产生量',
            fieldType: 'number',
            config: { unit: '吨' }
          },
          { code: 'E2.3.1.2', name: '一般固废处置量', fieldType: 'number', config: { unit: '吨' } },
          {
            code: 'E2.3.1.3',
            name: '一般固废综合利用率',
            fieldType: 'number',
            config: { unit: '%' }
          }
        ]
      },
      {
        code: 'E2.3.2',
        name: '危险废物',
        metrics: [
          { code: 'E2.3.2.1', name: '危废产生量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.3.2.2', name: '危废合规处置量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E2.3.2.3', name: '危废合规处置率', fieldType: 'number', config: { unit: '%' } }
        ]
      }
    ]
  }
]

// E3 资源消耗分类与指标
const e3Categories = [
  {
    code: 'E3.1',
    name: '能源消耗',
    children: [
      {
        code: 'E3.1.1',
        name: '化石能源',
        metrics: [
          { code: 'E3.1.1.1', name: '煤炭消耗量', fieldType: 'number', config: { unit: '吨' } },
          { code: 'E3.1.1.2', name: '天然气消耗量', fieldType: 'number', config: { unit: '万立方米' } },
          { code: 'E3.1.1.3', name: '汽油消耗量', fieldType: 'number', config: { unit: '升' } },
          { code: 'E3.1.1.4', name: '柴油消耗量', fieldType: 'number', config: { unit: '升' } }
        ]
      },
      {
        code: 'E3.1.2',
        name: '电力消耗',
        metrics: [
          { code: 'E3.1.2.1', name: '总用电量', fieldType: 'number', config: { unit: '万kWh' } },
          { code: 'E3.1.2.2', name: '可再生能源用电量', fieldType: 'number', config: { unit: '万kWh' } },
          { code: 'E3.1.2.3', name: '可再生能源占比', fieldType: 'number', config: { unit: '%' } }
        ]
      }
    ]
  },
  {
    code: 'E3.2',
    name: '水资源',
    metrics: [
      { code: 'E3.2.1', name: '新鲜水取用量', fieldType: 'number', config: { unit: '吨' } },
      { code: 'E3.2.2', name: '循环水使用量', fieldType: 'number', config: { unit: '吨' } },
      { code: 'E3.2.3', name: '水循环利用率', fieldType: 'number', config: { unit: '%' } },
      { code: 'E3.2.4', name: '单位产值耗水量', fieldType: 'number', config: { unit: '吨/万元' } }
    ]
  },
  {
    code: 'E3.3',
    name: '原材料',
    metrics: [
      { code: 'E3.3.1', name: '主要原材料消耗量', fieldType: 'number', config: { unit: '吨' } },
      { code: 'E3.3.2', name: '再生材料使用量', fieldType: 'number', config: { unit: '吨' } },
      { code: 'E3.3.3', name: '再生材料使用比例', fieldType: 'number', config: { unit: '%' } },
      { code: 'E3.3.4', name: '包装材料消耗量', fieldType: 'number', config: { unit: '吨' } }
    ]
  }
]

// E4 环境管理分类与指标
const e4Categories = [
  {
    code: 'E4.1',
    name: '环境管理体系',
    metrics: [
      {
        code: 'E4.1.1',
        name: 'ISO14001认证',
        fieldType: 'select',
        config: {
          options: [
            { label: '已认证', value: 'yes' },
            { label: '认证中', value: 'pending' },
            { label: '未认证', value: 'no' }
          ]
        }
      },
      {
        code: 'E4.1.2',
        name: 'ISO50001认证',
        fieldType: 'select',
        config: {
          options: [
            { label: '已认证', value: 'yes' },
            { label: '认证中', value: 'pending' },
            { label: '未认证', value: 'no' }
          ]
        }
      },
      { code: 'E4.1.3', name: '环境管理投入', fieldType: 'number', config: { unit: '万元' } }
    ]
  },
  {
    code: 'E4.2',
    name: '环境合规',
    metrics: [
      { code: 'E4.2.1', name: '环境处罚次数', fieldType: 'number', config: { unit: '次' } },
      { code: 'E4.2.2', name: '环境处罚金额', fieldType: 'number', config: { unit: '万元' } },
      { code: 'E4.2.3', name: '环境应急事件数', fieldType: 'number', config: { unit: '次' } }
    ]
  }
]

// S1 员工分类与指标
const s1Categories = [
  {
    code: 'S1.1',
    name: '员工基本情况',
    children: [
      {
        code: 'S1.1.1',
        name: '员工规模',
        metrics: [
          { code: 'S1.1.1.1', name: '员工总数', fieldType: 'number', config: { unit: '人' } },
          { code: 'S1.1.1.2', name: '正式员工数', fieldType: 'number', config: { unit: '人' } },
          { code: 'S1.1.1.3', name: '合同制员工数', fieldType: 'number', config: { unit: '人' } },
          { code: 'S1.1.1.4', name: '实习生数', fieldType: 'number', config: { unit: '人' } }
        ]
      },
      {
        code: 'S1.1.2',
        name: '员工多元化',
        metrics: [
          { code: 'S1.1.2.1', name: '女性员工占比', fieldType: 'number', config: { unit: '%' } },
          { code: 'S1.1.2.2', name: '女性管理层占比', fieldType: 'number', config: { unit: '%' } },
          { code: 'S1.1.2.3', name: '少数民族员工占比', fieldType: 'number', config: { unit: '%' } },
          { code: 'S1.1.2.4', name: '残疾人员工数', fieldType: 'number', config: { unit: '人' } }
        ]
      }
    ]
  },
  {
    code: 'S1.2',
    name: '员工权益',
    children: [
      {
        code: 'S1.2.1',
        name: '薪酬福利',
        metrics: [
          { code: 'S1.2.1.1', name: '人均薪酬', fieldType: 'number', config: { unit: '万元' } },
          {
            code: 'S1.2.1.2',
            name: '社保覆盖率',
            fieldType: 'number',
            config: { unit: '%', min: 0, max: 100 }
          },
          {
            code: 'S1.2.1.3',
            name: '劳动合同签订率',
            fieldType: 'number',
            config: { unit: '%', min: 0, max: 100 }
          }
        ]
      },
      {
        code: 'S1.2.2',
        name: '工作时间',
        metrics: [
          { code: 'S1.2.2.1', name: '人均加班时长', fieldType: 'number', config: { unit: '小时/月' } },
          { code: 'S1.2.2.2', name: '带薪年假天数', fieldType: 'number', config: { unit: '天' } }
        ]
      }
    ]
  },
  {
    code: 'S1.3',
    name: '员工发展',
    metrics: [
      { code: 'S1.3.1', name: '人均培训时长', fieldType: 'number', config: { unit: '小时' } },
      { code: 'S1.3.2', name: '培训覆盖率', fieldType: 'number', config: { unit: '%' } },
      { code: 'S1.3.3', name: '培训投入', fieldType: 'number', config: { unit: '万元' } },
      { code: 'S1.3.4', name: '员工流失率', fieldType: 'number', config: { unit: '%' } }
    ]
  },
  {
    code: 'S1.4',
    name: '职业健康安全',
    metrics: [
      { code: 'S1.4.1', name: '工伤事故数', fieldType: 'number', config: { unit: '次' } },
      { code: 'S1.4.2', name: '工伤死亡人数', fieldType: 'number', config: { unit: '人' } },
      { code: 'S1.4.3', name: '职业病发病数', fieldType: 'number', config: { unit: '人' } },
      { code: 'S1.4.4', name: '安全培训覆盖率', fieldType: 'number', config: { unit: '%' } }
    ]
  }
]

// S2 供应链管理分类与指标
const s2Categories = [
  {
    code: 'S2.1',
    name: '供应商管理',
    metrics: [
      { code: 'S2.1.1', name: '供应商总数', fieldType: 'number', config: { unit: '家' } },
      { code: 'S2.1.2', name: '新增供应商数', fieldType: 'number', config: { unit: '家' } },
      { code: 'S2.1.3', name: '供应商审核率', fieldType: 'number', config: { unit: '%' } },
      { code: 'S2.1.4', name: '本地采购比例', fieldType: 'number', config: { unit: '%' } }
    ]
  },
  {
    code: 'S2.2',
    name: '供应商ESG评估',
    metrics: [
      { code: 'S2.2.1', name: 'ESG评估覆盖率', fieldType: 'number', config: { unit: '%' } },
      { code: 'S2.2.2', name: 'ESG高风险供应商数', fieldType: 'number', config: { unit: '家' } },
      { code: 'S2.2.3', name: '供应商ESG培训次数', fieldType: 'number', config: { unit: '次' } }
    ]
  }
]

// S3 社会责任分类与指标
const s3Categories = [
  {
    code: 'S3.1',
    name: '社区投入',
    metrics: [
      { code: 'S3.1.1', name: '公益捐赠金额', fieldType: 'number', config: { unit: '万元' } },
      { code: 'S3.1.2', name: '志愿服务时长', fieldType: 'number', config: { unit: '小时' } },
      { code: 'S3.1.3', name: '志愿者人数', fieldType: 'number', config: { unit: '人' } }
    ]
  },
  {
    code: 'S3.2',
    name: '客户服务',
    metrics: [
      { code: 'S3.2.1', name: '客户满意度', fieldType: 'number', config: { unit: '%' } },
      { code: 'S3.2.2', name: '客户投诉率', fieldType: 'number', config: { unit: '%' } },
      { code: 'S3.2.3', name: '产品召回次数', fieldType: 'number', config: { unit: '次' } }
    ]
  }
]

// G1 公司治理结构分类与指标
const g1Categories = [
  {
    code: 'G1.1',
    name: '董事会',
    metrics: [
      { code: 'G1.1.1', name: '董事会人数', fieldType: 'number', config: { unit: '人' } },
      { code: 'G1.1.2', name: '独立董事占比', fieldType: 'number', config: { unit: '%' } },
      { code: 'G1.1.3', name: '女性董事占比', fieldType: 'number', config: { unit: '%' } },
      { code: 'G1.1.4', name: '董事会会议次数', fieldType: 'number', config: { unit: '次' } }
    ]
  },
  {
    code: 'G1.2',
    name: '监事会',
    metrics: [
      { code: 'G1.2.1', name: '监事会人数', fieldType: 'number', config: { unit: '人' } },
      { code: 'G1.2.2', name: '监事会会议次数', fieldType: 'number', config: { unit: '次' } }
    ]
  },
  {
    code: 'G1.3',
    name: '高管',
    metrics: [
      { code: 'G1.3.1', name: '高管总数', fieldType: 'number', config: { unit: '人' } },
      { code: 'G1.3.2', name: '女性高管占比', fieldType: 'number', config: { unit: '%' } },
      { code: 'G1.3.3', name: '高管平均任期', fieldType: 'number', config: { unit: '年' } }
    ]
  }
]

// G2 公司治理机制分类与指标
const g2Categories = [
  {
    code: 'G2.1',
    name: '内部控制',
    metrics: [
      {
        code: 'G2.1.1',
        name: '内控制度健全性',
        fieldType: 'select',
        config: {
          options: [
            { label: '健全', value: 'complete' },
            { label: '基本健全', value: 'mostly' },
            { label: '不健全', value: 'incomplete' }
          ]
        }
      },
      { code: 'G2.1.2', name: '内部审计次数', fieldType: 'number', config: { unit: '次' } },
      { code: 'G2.1.3', name: '内控缺陷整改率', fieldType: 'number', config: { unit: '%' } }
    ]
  },
  {
    code: 'G2.2',
    name: '风险管理',
    metrics: [
      {
        code: 'G2.2.1',
        name: '风险管理制度',
        fieldType: 'select',
        config: {
          options: [
            { label: '已建立', value: 'established' },
            { label: '建立中', value: 'building' },
            { label: '未建立', value: 'none' }
          ]
        }
      },
      { code: 'G2.2.2', name: '重大风险事件数', fieldType: 'number', config: { unit: '次' } }
    ]
  },
  {
    code: 'G2.3',
    name: '商业道德',
    metrics: [
      { code: 'G2.3.1', name: '反腐败培训覆盖率', fieldType: 'number', config: { unit: '%' } },
      { code: 'G2.3.2', name: '廉洁举报数', fieldType: 'number', config: { unit: '件' } },
      { code: 'G2.3.3', name: '行政处罚次数', fieldType: 'number', config: { unit: '次' } },
      { code: 'G2.3.4', name: '诉讼案件数', fieldType: 'number', config: { unit: '件' } }
    ]
  },
  {
    code: 'G2.4',
    name: '信息披露',
    metrics: [
      { code: 'G2.4.1', name: 'ESG报告发布', fieldType: 'select', config: { options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] } },
      { code: 'G2.4.2', name: '信息披露违规次数', fieldType: 'number', config: { unit: '次' } }
    ]
  }
]

// 子模块分类映射
const subModuleCategoriesMap: Record<string, any[]> = {
  E1: e1Categories,
  E2: e2Categories,
  E3: e3Categories,
  E4: e4Categories,
  S1: s1Categories,
  S2: s2Categories,
  S3: s3Categories,
  G1: g1Categories,
  G2: g2Categories
}

// 执行初始化
// 测试用户数据
const testUsers = [
  { email: 'admin@example.com', password: 'Admin123!', name: '系统管理员', role: 'admin' },
  { email: 'auditor@example.com', password: 'Auditor123!', name: '外部审计师', role: 'auditor' },
  { email: 'entry@example.com', password: 'Entry123!', name: '数据录入员', role: 'entry' },
  { email: 'viewer@example.com', password: 'Viewer123!', name: '董事会成员', role: 'viewer' }
]

// 密码加密函数
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.default.hash(password, 12)
}

// 插入测试用户
async function seedUsers() {
  console.log('👥 插入测试用户...')

  for (const user of testUsers) {
    const hashedPassword = await hashPassword(user.password)
    await db
      .insert(schema.users)
      .values({
        email: user.email,
        password: hashedPassword,
        name: user.name,
        role: user.role
      })
      .onConflictDoNothing()
    console.log(`  ✓ ${user.role}: ${user.email}`)
  }
}

async function seed() {
  console.log('🌱 开始初始化 ESG 数据库...')

  try {
    // 0. 插入测试用户
    await seedUsers()

    // 1. 插入模块
    console.log('📦 插入模块...')
    for (const m of modules) {
      await db
        .insert(schema.esgModules)
        .values(m)
        .onConflictDoNothing()
    }

    // 2. 获取模块 ID 映射
    const moduleRecords = await db.select().from(schema.esgModules)
    const moduleIdMap = new Map(moduleRecords.map((m) => [m.code, m.id]))

    // 3. 插入子模块
    console.log('📁 插入子模块...')
    for (const sm of subModules) {
      const moduleId = moduleIdMap.get(sm.moduleCode)
      if (!moduleId) continue

      await db
        .insert(schema.esgSubModules)
        .values({
          moduleId,
          code: sm.code,
          name: sm.name,
          description: sm.description,
          sortOrder: sm.sortOrder
        })
        .onConflictDoNothing()
    }

    // 4. 获取子模块 ID 映射
    const subModuleRecords = await db.select().from(schema.esgSubModules)
    const subModuleIdMap = new Map(subModuleRecords.map((sm) => [sm.code, sm.id]))

    // 5. 插入分类和指标
    console.log('📊 插入分类和指标...')
    for (const [subModuleCode, categories] of Object.entries(subModuleCategoriesMap)) {
      const subModuleId = subModuleIdMap.get(subModuleCode)
      if (!subModuleId) continue

      await insertCategories(subModuleId, null, categories)
    }

    console.log('✅ ESG 数据库初始化完成!')
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    throw error
  }
}

// 递归插入分类和指标
async function insertCategories(subModuleId: number, parentId: number | null, categories: any[]) {
  for (const cat of categories) {
    // 插入分类
    const [inserted] = await db
      .insert(schema.esgCategories)
      .values({
        subModuleId,
        parentId,
        code: cat.code,
        name: cat.name,
        level: cat.code.split('.').length,
        sortOrder: categories.indexOf(cat) + 1
      })
      .onConflictDoNothing()
      .returning()

    const categoryId = inserted?.id

    if (!categoryId) {
      // 如果分类已存在，查询其 ID
      const existing = await db
        .select()
        .from(schema.esgCategories)
        .where((c: any) => c.code === cat.code)
        .limit(1)
      if (existing.length) {
        const existingId = existing[0].id

        // 插入指标
        if (cat.metrics) {
          await insertMetrics(existingId, cat.metrics)
        }

        // 递归插入子分类
        if (cat.children) {
          await insertCategories(subModuleId, existingId, cat.children)
        }
      }
      continue
    }

    // 插入指标
    if (cat.metrics) {
      await insertMetrics(categoryId, cat.metrics)
    }

    // 递归插入子分类
    if (cat.children) {
      await insertCategories(subModuleId, categoryId, cat.children)
    }
  }
}

// 插入指标
async function insertMetrics(categoryId: number, metrics: any[]) {
  for (const metric of metrics) {
    await db
      .insert(schema.esgMetrics)
      .values({
        categoryId,
        code: metric.code,
        name: metric.name,
        fieldType: metric.fieldType,
        fieldConfig: metric.config ? JSON.stringify(metric.config) : null,
        required: metric.required ?? false,
        sortOrder: metrics.indexOf(metric) + 1
      })
      .onConflictDoNothing()
  }
}

// 预设的计算公式
const predefinedFormulas = [
  // 员工相关指标
  {
    metricCode: 'S1.1.1.1', // 员工总数
    formulaType: 'count',
    dataSource: 'employees',
    formula: { type: 'count', dataSource: 'employees', filter: { status: 'active' } },
    description: '统计在职员工总数'
  },
  {
    metricCode: 'S1.1.1.2', // 女性员工数
    formulaType: 'count',
    dataSource: 'employees',
    formula: { type: 'count', dataSource: 'employees', filter: { gender: 'female', status: 'active' } },
    description: '统计在职女性员工数'
  },
  {
    metricCode: 'S1.1.1.3', // 女性员工比例
    formulaType: 'percentage',
    dataSource: 'employees',
    formula: {
      type: 'percentage',
      numerator: { type: 'count', dataSource: 'employees', filter: { gender: 'female', status: 'active' } },
      denominator: { type: 'count', dataSource: 'employees', filter: { status: 'active' } }
    },
    description: '女性员工占比 = 女性员工数 / 总员工数 × 100%'
  },
  // 碳排放相关
  {
    metricCode: 'E1.1.1.1', // 范围1排放
    formulaType: 'sum',
    dataSource: 'carbon_emissions',
    formula: { type: 'sum', dataSource: 'carbon_emissions', field: 'emission', filter: { scope: 1 } },
    description: '范围1碳排放量合计'
  },
  {
    metricCode: 'E1.2.1.1', // 范围2排放
    formulaType: 'sum',
    dataSource: 'carbon_emissions',
    formula: { type: 'sum', dataSource: 'carbon_emissions', field: 'emission', filter: { scope: 2 } },
    description: '范围2碳排放量合计'
  },
  // 培训相关
  {
    metricCode: 'S1.2.1.1', // 培训总时长
    formulaType: 'sum',
    dataSource: 'training_records',
    formula: { type: 'sum', dataSource: 'training_records', field: 'duration' },
    description: '员工培训总时长'
  },
  {
    metricCode: 'S1.2.1.2', // 人均培训时长
    formulaType: 'ratio',
    dataSource: 'training_records',
    formula: {
      type: 'ratio',
      numerator: { type: 'sum', dataSource: 'training_records', field: 'duration' },
      denominator: { type: 'count', dataSource: 'employees', filter: { status: 'active' } }
    },
    description: '人均培训时长 = 培训总时长 / 员工总数'
  },
  // 安全相关
  {
    metricCode: 'S1.3.1.1', // 安全事故数
    formulaType: 'count',
    dataSource: 'safety_incidents',
    formula: { type: 'count', dataSource: 'safety_incidents' },
    description: '安全事故总数'
  },
  {
    metricCode: 'S1.3.1.2', // 损失工时
    formulaType: 'sum',
    dataSource: 'safety_incidents',
    formula: { type: 'sum', dataSource: 'safety_incidents', field: 'lostDays' },
    description: '安全事故导致的损失工时(天)'
  },
  // 供应商相关
  {
    metricCode: 'S2.1.1.1', // 供应商总数
    formulaType: 'count',
    dataSource: 'suppliers',
    formula: { type: 'count', dataSource: 'suppliers', filter: { status: 'active' } },
    description: '活跃供应商总数'
  },
  {
    metricCode: 'S2.1.1.2', // 本地供应商比例
    formulaType: 'percentage',
    dataSource: 'suppliers',
    formula: {
      type: 'percentage',
      numerator: { type: 'count', dataSource: 'suppliers', filter: { isLocal: true, status: 'active' } },
      denominator: { type: 'count', dataSource: 'suppliers', filter: { status: 'active' } }
    },
    description: '本地供应商占比'
  },
  // 公益相关
  {
    metricCode: 'S3.1.1.1', // 捐赠总额
    formulaType: 'sum',
    dataSource: 'donations',
    formula: { type: 'sum', dataSource: 'donations', field: 'amount' },
    description: '公益捐赠总金额'
  },
  {
    metricCode: 'S3.1.1.2', // 志愿服务时长
    formulaType: 'sum',
    dataSource: 'donations',
    formula: { type: 'sum', dataSource: 'donations', field: 'volunteerHours' },
    description: '员工志愿服务总时长'
  },
  // 能源相关
  {
    metricCode: 'E3.1.1.1', // 能源消耗总量
    formulaType: 'sum',
    dataSource: 'energy_consumption',
    formula: { type: 'sum', dataSource: 'energy_consumption', field: 'consumption' },
    description: '能源消耗总量'
  },
  {
    metricCode: 'E3.1.1.2', // 可再生能源比例
    formulaType: 'percentage',
    dataSource: 'energy_consumption',
    formula: {
      type: 'percentage',
      numerator: { type: 'sum', dataSource: 'energy_consumption', field: 'consumption', filter: { isRenewable: true } },
      denominator: { type: 'sum', dataSource: 'energy_consumption', field: 'consumption' }
    },
    description: '可再生能源占比'
  },
  // 废物相关
  {
    metricCode: 'E2.3.1.1', // 废物总量
    formulaType: 'sum',
    dataSource: 'waste_data',
    formula: { type: 'sum', dataSource: 'waste_data', field: 'quantity' },
    description: '废物产生总量'
  },
  {
    metricCode: 'E2.3.1.2', // 废物回收率
    formulaType: 'percentage',
    dataSource: 'waste_data',
    formula: {
      type: 'percentage',
      numerator: { type: 'sum', dataSource: 'waste_data', field: 'quantity', filter: { disposalMethod: 'recycling' } },
      denominator: { type: 'sum', dataSource: 'waste_data', field: 'quantity' }
    },
    description: '废物回收利用率'
  }
]

// 插入计算公式
async function seedFormulas() {
  console.log('正在插入计算公式...')

  for (const formula of predefinedFormulas) {
    // 查找对应的指标
    const metric = await db.query.esgMetrics.findFirst({
      where: (metrics, { eq }) => eq(metrics.code, formula.metricCode)
    })

    if (metric) {
      await db
        .insert(schema.metricFormulas)
        .values({
          metricId: metric.id,
          formulaType: formula.formulaType,
          dataSource: formula.dataSource,
          formula: JSON.stringify(formula.formula),
          description: formula.description,
          isActive: true
        })
        .onConflictDoNothing()
      console.log(`  ✓ ${formula.metricCode}: ${formula.description}`)
    } else {
      console.log(`  ⚠ 未找到指标 ${formula.metricCode}`)
    }
  }
}

// 导入国际标准
async function seedInternationalStandards() {
  const { seedInternationalStandards: seedStandards } = await import('./seeds/international-standards')
  await seedStandards(db)
}

// 执行
seed()
  .then(() => seedFormulas())
  .then(() => seedInternationalStandards())
  .then(() => {
    console.log('\n种子数据插入完成！')
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
