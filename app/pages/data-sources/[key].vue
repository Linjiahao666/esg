<script setup lang="ts">
  definePageMeta({
    layout: "default",
    middleware: ["role"],
    roles: ["admin", "entry"]
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const dataSourceKey = computed(() => route.params.key as string)

  // 数据源配置（完整的 27 个数据源）
  const dataSourceConfig: Record<string, { name: string; icon: string; columns: any[] }> = {
    employees: {
      name: "员工数据",
      icon: "i-heroicons-users",
      columns: [
        { id: "employeeNo", header: "工号", accessorKey: "employeeNo" },
        { id: "name", header: "姓名", accessorKey: "name" },
        { id: "gender", header: "性别", accessorKey: "gender" },
        { id: "department", header: "部门", accessorKey: "department" },
        { id: "position", header: "职位", accessorKey: "position" },
        { id: "employeeType", header: "类型", accessorKey: "employeeType" },
        { id: "status", header: "状态", accessorKey: "status" },
        { id: "hireDate", header: "入职日期", accessorKey: "hireDate" }
      ]
    },
    energy_consumption: {
      name: "能源消耗",
      icon: "i-heroicons-bolt",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "energyType", header: "能源类型", accessorKey: "energyType" },
        { id: "consumption", header: "消耗量", accessorKey: "consumption" },
        { id: "unit", header: "单位", accessorKey: "unit" },
        { id: "cost", header: "费用", accessorKey: "cost" },
        { id: "isRenewable", header: "可再生", accessorKey: "isRenewable" }
      ]
    },
    carbon_emissions: {
      name: "碳排放",
      icon: "i-heroicons-cloud",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "scope", header: "范围", accessorKey: "scope" },
        { id: "category", header: "类别", accessorKey: "category" },
        { id: "source", header: "排放源", accessorKey: "source" },
        { id: "emission", header: "排放量(tCO2e)", accessorKey: "emission" }
      ]
    },
    waste_data: {
      name: "废弃物管理",
      icon: "i-heroicons-trash",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "wasteType", header: "废物类型", accessorKey: "wasteType" },
        { id: "wasteName", header: "废物名称", accessorKey: "wasteName" },
        { id: "quantity", header: "数量", accessorKey: "quantity" },
        { id: "unit", header: "单位", accessorKey: "unit" },
        { id: "disposalMethod", header: "处置方式", accessorKey: "disposalMethod" }
      ]
    },
    suppliers: {
      name: "供应商",
      icon: "i-heroicons-truck",
      columns: [
        { id: "code", header: "编号", accessorKey: "code" },
        { id: "name", header: "名称", accessorKey: "name" },
        { id: "category", header: "类别", accessorKey: "category" },
        { id: "region", header: "地区", accessorKey: "region" },
        { id: "isLocal", header: "本地", accessorKey: "isLocal" },
        { id: "esgRating", header: "ESG评级", accessorKey: "esgRating" },
        { id: "status", header: "状态", accessorKey: "status" }
      ]
    },
    training_records: {
      name: "培训记录",
      icon: "i-heroicons-academic-cap",
      columns: [
        { id: "trainingName", header: "培训名称", accessorKey: "trainingName" },
        { id: "trainingType", header: "类型", accessorKey: "trainingType" },
        { id: "trainingDate", header: "日期", accessorKey: "trainingDate" },
        { id: "duration", header: "时长(小时)", accessorKey: "duration" },
        { id: "provider", header: "培训机构", accessorKey: "provider" },
        { id: "isPassed", header: "是否通过", accessorKey: "isPassed" }
      ]
    },
    safety_incidents: {
      name: "安全事故",
      icon: "i-heroicons-shield-exclamation",
      columns: [
        { id: "incidentNo", header: "事故编号", accessorKey: "incidentNo" },
        { id: "incidentDate", header: "日期", accessorKey: "incidentDate" },
        { id: "incidentType", header: "类型", accessorKey: "incidentType" },
        { id: "severity", header: "严重程度", accessorKey: "severity" },
        { id: "injuredCount", header: "受伤人数", accessorKey: "injuredCount" },
        { id: "status", header: "状态", accessorKey: "status" }
      ]
    },
    donations: {
      name: "公益捐赠",
      icon: "i-heroicons-heart",
      columns: [
        { id: "donationDate", header: "日期", accessorKey: "donationDate" },
        { id: "donationType", header: "类型", accessorKey: "donationType" },
        { id: "category", header: "类别", accessorKey: "category" },
        { id: "recipient", header: "受捐方", accessorKey: "recipient" },
        { id: "amount", header: "金额", accessorKey: "amount" },
        { id: "volunteerHours", header: "志愿时长", accessorKey: "volunteerHours" }
      ]
    },
    environmental_compliance: {
      name: "环境合规",
      icon: "i-heroicons-document-check",
      columns: [
        { id: "recordDate", header: "日期", accessorKey: "recordDate" },
        { id: "recordType", header: "类型", accessorKey: "recordType" },
        { id: "authority", header: "监管机构", accessorKey: "authority" },
        { id: "description", header: "描述", accessorKey: "description" },
        { id: "status", header: "状态", accessorKey: "status" }
      ]
    },
    // 新增数据源
    water_consumption: {
      name: "水资源消耗",
      icon: "i-heroicons-beaker",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "waterType", header: "用水类型", accessorKey: "waterType" },
        { id: "consumption", header: "用水量", accessorKey: "consumption" },
        { id: "unit", header: "单位", accessorKey: "unit" },
        { id: "recycledAmount", header: "循环水量", accessorKey: "recycledAmount" }
      ]
    },
    waste_water_records: {
      name: "废水排放",
      icon: "i-heroicons-funnel",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "dischargeType", header: "排放类型", accessorKey: "dischargeType" },
        { id: "volume", header: "排放量", accessorKey: "volume" },
        { id: "cod", header: "COD浓度", accessorKey: "cod" },
        { id: "ammonia", header: "氨氮浓度", accessorKey: "ammonia" }
      ]
    },
    air_emission_records: {
      name: "废气排放",
      icon: "i-heroicons-cloud-arrow-up",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "emissionSource", header: "排放源", accessorKey: "emissionSource" },
        { id: "pollutant", header: "污染物", accessorKey: "pollutant" },
        { id: "emission", header: "排放量", accessorKey: "emission" },
        { id: "unit", header: "单位", accessorKey: "unit" }
      ]
    },
    material_consumption: {
      name: "物料消耗",
      icon: "i-heroicons-cube",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "materialType", header: "物料类型", accessorKey: "materialType" },
        { id: "materialName", header: "物料名称", accessorKey: "materialName" },
        { id: "consumption", header: "消耗量", accessorKey: "consumption" },
        { id: "unit", header: "单位", accessorKey: "unit" }
      ]
    },
    noise_records: {
      name: "噪声监测",
      icon: "i-heroicons-speaker-wave",
      columns: [
        { id: "recordDate", header: "日期", accessorKey: "recordDate" },
        { id: "location", header: "监测点", accessorKey: "location" },
        { id: "dayLevel", header: "昼间噪声", accessorKey: "dayLevel" },
        { id: "nightLevel", header: "夜间噪声", accessorKey: "nightLevel" }
      ]
    },
    employee_work_time: {
      name: "员工工时",
      icon: "i-heroicons-clock",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "employeeNo", header: "工号", accessorKey: "employeeNo" },
        { id: "regularHours", header: "正常工时", accessorKey: "regularHours" },
        { id: "overtimeHours", header: "加班工时", accessorKey: "overtimeHours" },
        { id: "leaveHours", header: "休假时间", accessorKey: "leaveHours" }
      ]
    },
    salary_records: {
      name: "薪酬数据",
      icon: "i-heroicons-currency-yen",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "employeeNo", header: "工号", accessorKey: "employeeNo" },
        { id: "baseSalary", header: "基本工资", accessorKey: "baseSalary" },
        { id: "bonus", header: "奖金", accessorKey: "bonus" },
        { id: "benefits", header: "福利", accessorKey: "benefits" }
      ]
    },
    board_members: {
      name: "董事会成员",
      icon: "i-heroicons-user-group",
      columns: [
        { id: "name", header: "姓名", accessorKey: "name" },
        { id: "gender", header: "性别", accessorKey: "gender" },
        { id: "position", header: "职务", accessorKey: "position" },
        { id: "isIndependent", header: "独立董事", accessorKey: "isIndependent" },
        { id: "tenure", header: "任期", accessorKey: "tenure" }
      ]
    },
    supervisors: {
      name: "监事会成员",
      icon: "i-heroicons-eye",
      columns: [
        { id: "name", header: "姓名", accessorKey: "name" },
        { id: "gender", header: "性别", accessorKey: "gender" },
        { id: "position", header: "职务", accessorKey: "position" },
        { id: "supervisorType", header: "类型", accessorKey: "supervisorType" },
        { id: "tenure", header: "任期", accessorKey: "tenure" }
      ]
    },
    executives: {
      name: "高管信息",
      icon: "i-heroicons-briefcase",
      columns: [
        { id: "name", header: "姓名", accessorKey: "name" },
        { id: "gender", header: "性别", accessorKey: "gender" },
        { id: "position", header: "职务", accessorKey: "position" },
        { id: "compensation", header: "薪酬", accessorKey: "compensation" },
        { id: "shareholding", header: "持股", accessorKey: "shareholding" }
      ]
    },
    shareholders: {
      name: "股东信息",
      icon: "i-heroicons-chart-pie",
      columns: [
        { id: "name", header: "股东名称", accessorKey: "name" },
        { id: "shareholderType", header: "类型", accessorKey: "shareholderType" },
        { id: "shares", header: "持股数", accessorKey: "shares" },
        { id: "percentage", header: "持股比例", accessorKey: "percentage" }
      ]
    },
    rd_investment: {
      name: "研发投入",
      icon: "i-heroicons-light-bulb",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "projectName", header: "项目名称", accessorKey: "projectName" },
        { id: "investment", header: "投入金额", accessorKey: "investment" },
        { id: "personnelCount", header: "研发人数", accessorKey: "personnelCount" }
      ]
    },
    patents: {
      name: "专利数据",
      icon: "i-heroicons-document-text",
      columns: [
        { id: "patentNo", header: "专利号", accessorKey: "patentNo" },
        { id: "patentName", header: "专利名称", accessorKey: "patentName" },
        { id: "patentType", header: "类型", accessorKey: "patentType" },
        { id: "applicationDate", header: "申请日期", accessorKey: "applicationDate" },
        { id: "status", header: "状态", accessorKey: "status" }
      ]
    },
    product_incidents: {
      name: "产品质量事件",
      icon: "i-heroicons-exclamation-triangle",
      columns: [
        { id: "incidentDate", header: "日期", accessorKey: "incidentDate" },
        { id: "incidentType", header: "类型", accessorKey: "incidentType" },
        { id: "productName", header: "产品名称", accessorKey: "productName" },
        { id: "severity", header: "严重程度", accessorKey: "severity" },
        { id: "status", header: "状态", accessorKey: "status" }
      ]
    },
    environment_investments: {
      name: "环保投资",
      icon: "i-heroicons-banknotes",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "projectName", header: "项目名称", accessorKey: "projectName" },
        { id: "investmentType", header: "投资类型", accessorKey: "investmentType" },
        { id: "amount", header: "投资金额", accessorKey: "amount" }
      ]
    },
    company_financials: {
      name: "公司财务",
      icon: "i-heroicons-calculator",
      columns: [
        { id: "period", header: "周期", accessorKey: "period" },
        { id: "revenue", header: "营业收入", accessorKey: "revenue" },
        { id: "profit", header: "净利润", accessorKey: "profit" },
        { id: "totalAssets", header: "总资产", accessorKey: "totalAssets" }
      ]
    },
    meeting_records: {
      name: "会议记录",
      icon: "i-heroicons-calendar",
      columns: [
        { id: "meetingDate", header: "会议日期", accessorKey: "meetingDate" },
        { id: "meetingType", header: "会议类型", accessorKey: "meetingType" },
        { id: "attendeeCount", header: "参会人数", accessorKey: "attendeeCount" },
        { id: "resolutions", header: "决议数", accessorKey: "resolutions" }
      ]
    },
    certifications: {
      name: "认证许可",
      icon: "i-heroicons-check-badge",
      columns: [
        { id: "certName", header: "认证名称", accessorKey: "certName" },
        { id: "certType", header: "认证类型", accessorKey: "certType" },
        { id: "issueDate", header: "发证日期", accessorKey: "issueDate" },
        { id: "expiryDate", header: "到期日期", accessorKey: "expiryDate" },
        { id: "status", header: "状态", accessorKey: "status" }
      ]
    }
  }

  const config = computed(
    () =>
      dataSourceConfig[dataSourceKey.value] || {
        name: "未知数据源",
        icon: "i-heroicons-question-mark-circle",
        columns: []
      }
  )

  // 格式化显示值
  function formatValue(value: any, key: string) {
    if (value === null || value === undefined) return "-"
    if (typeof value === "boolean") return value ? "是" : "否"
    if (key === "gender") return value === "male" ? "男" : value === "female" ? "女" : value
    if (key === "isRenewable" || key === "isLocal" || key === "isPassed") return value ? "是" : "否"
    return value
  }

  // 表格列配置（添加 cell 函数用于格式化）
  const tableColumns = computed(() => {
    return config.value.columns.map((col: any) => ({
      ...col,
      cell: ({ row }: any) => formatValue(row.original[col.accessorKey], col.accessorKey)
    }))
  })

  // 数据列表
  const page = ref(1)
  const pageSize = ref(20)
  const data = ref<any[]>([])
  const totalCount = ref(0)
  const loading = ref(false)

  // 获取数据
  async function fetchData() {
    loading.value = true
    try {
      const response = (await $fetch(`/api/data-sources/${dataSourceKey.value}`, {
        query: { page: page.value, pageSize: pageSize.value }
      })) as any

      if (response.success) {
        data.value = response.data || []
        totalCount.value = response.total || 0
      }
    } catch (e: any) {
      toast.add({
        title: "获取数据失败",
        description: e.message,
        color: "error"
      })
    } finally {
      loading.value = false
    }
  }

  // 导入相关
  const showImportModal = ref(false)
  const importFile = ref<File | null>(null)
  const importFileContent = ref<string>("") // 存储文件内容
  const importFileName = ref<string>("") // 存储文件名
  const importing = ref(false)
  const analyzing = ref(false)
  const previewData = ref<any[]>([])
  const previewColumns = ref<string[]>([])

  // 智能字段映射相关
  const importStep = ref<"upload" | "mapping" | "preview">("upload")
  const sourceColumns = ref<string[]>([])
  const targetFields = ref<any[]>([])
  const suggestedMapping = ref<Record<string, string>>({})
  const matchDetails = ref<Record<string, any>>({})
  const customMapping = ref<Record<string, string>>({})
  const unmatchedFields = ref<string[]>([])
  const missingRequiredFields = ref<any[]>([])
  const sampleData = ref<any[]>([])
  const selectedSourceSystem = ref("")
  const saveAsTemplate = ref(false)
  const newTemplateName = ref("")

  // 数据对比预览
  const showDataComparison = ref(false)
  const comparisonIndex = ref(0) // 当前预览的数据行索引

  // 计算当前对比的原始数据行
  const currentOriginalRow = computed(() => {
    if (!sampleData.value || !sampleData.value.length) {
      return {}
    }
    return sampleData.value[comparisonIndex.value] || {}
  })

  // 计算映射后的数据行
  const currentMappedRow = computed(() => {
    const original = currentOriginalRow.value
    const mapped: Record<string, any> = {}

    for (const [sourceField, targetField] of Object.entries(customMapping.value)) {
      if (targetField && original[sourceField] !== undefined) {
        const targetLabel =
          targetFields.value.find((f: any) => f.key === targetField)?.label || targetField
        mapped[targetField] = {
          value: original[sourceField],
          label: targetLabel
        }
      }
    }
    return mapped
  })

  // 获取映射对照列表（用于展示 a -> b）
  const mappingComparisonList = computed(() => {
    // 确保 sourceColumns 和 customMapping 有效
    if (!sourceColumns.value || !sourceColumns.value.length) {
      return []
    }

    const list: Array<{
      sourceField: string
      sourceValue: any
      targetField: string
      targetLabel: string
      targetValue: any
      confidence: number
      method: string
    }> = []

    for (const sourceField of sourceColumns.value) {
      const targetField = customMapping.value?.[sourceField]
      if (targetField) {
        const targetInfo = targetFields.value?.find((f: any) => f.key === targetField)
        const detail = matchDetails.value?.[sourceField]
        list.push({
          sourceField,
          sourceValue: currentOriginalRow.value?.[sourceField] ?? null,
          targetField,
          targetLabel: targetInfo?.label || targetField,
          targetValue: currentOriginalRow.value?.[sourceField] ?? null,
          confidence: detail?.confidence || 0,
          method: detail?.method || "manual"
        })
      }
    }
    return list
  })

  // 切换预览行
  function nextComparisonRow() {
    if (comparisonIndex.value < sampleData.value.length - 1) {
      comparisonIndex.value++
    } else {
      comparisonIndex.value = 0
    }
  }

  function prevComparisonRow() {
    if (comparisonIndex.value > 0) {
      comparisonIndex.value--
    } else {
      comparisonIndex.value = sampleData.value.length - 1
    }
  }

  // 来源系统选项
  const sourceSystemOptions = [
    { value: "_auto_", label: "自动识别" },
    { value: "SAP", label: "SAP" },
    { value: "用友", label: "用友 NC/U8" },
    { value: "金蝶", label: "金蝶 EAS/K3" },
    { value: "Oracle", label: "Oracle ERP" },
    { value: "Workday", label: "Workday" },
    { value: "其他", label: "其他系统" }
  ]

  // 打开导入模态框
  function openImportModal() {
    showImportModal.value = true
    importStep.value = "upload"
    importFile.value = null
    importFileContent.value = ""
    importFileName.value = ""
    previewData.value = []
    sourceColumns.value = []
    customMapping.value = {}
    suggestedMapping.value = {}
    selectedSourceSystem.value = "_auto_"
    saveAsTemplate.value = false
    newTemplateName.value = ""
    showDataComparison.value = false
    comparisonIndex.value = 0
  }

  // 文件选择
  async function onFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      importFile.value = file
      importFileName.value = file.name

      // 立即读取文件内容，避免后续 ERR_UPLOAD_FILE_CHANGED 错误
      try {
        importFileContent.value = await file.text()
      } catch (e) {
        console.error("读取文件失败:", e)
        toast.add({
          title: "读取文件失败",
          color: "error"
        })
      }
    }
  }

  // 清除文件
  function clearFile() {
    importFile.value = null
    importFileContent.value = ""
    importFileName.value = ""
    // 重置 input 元素
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  // 分析文件字段（智能匹配）
  async function analyzeFile() {
    if (!importFileContent.value) {
      toast.add({
        title: "请先选择文件",
        color: "warning"
      })
      return
    }

    analyzing.value = true

    // 使用已读取的文件内容创建新的 Blob
    const blob = new Blob([importFileContent.value], { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", blob, importFileName.value || "upload.csv")
    formData.append("dataSource", dataSourceKey.value)
    formData.append("action", "analyze")
    if (selectedSourceSystem.value && selectedSourceSystem.value !== "_auto_") {
      formData.append("sourceSystem", selectedSourceSystem.value)
    }

    try {
      const response = (await $fetch("/api/esg/records.bulk", {
        method: "POST",
        body: formData
      })) as any

      if (response.success) {
        sourceColumns.value = response.sourceColumns || []
        targetFields.value = response.targetFields || []
        suggestedMapping.value = response.suggestedMapping || {}
        matchDetails.value = response.matchDetails || {}
        sampleData.value = response.sampleData || []

        // 初始化自定义映射为建议映射
        customMapping.value = { ...suggestedMapping.value }

        // 计算未匹配字段
        unmatchedFields.value = sourceColumns.value.filter((f) => !suggestedMapping.value[f])

        // 计算缺失的必填字段
        const mappedTargets = Object.values(customMapping.value)
        missingRequiredFields.value = targetFields.value.filter(
          (f: any) => f.required && !mappedTargets.includes(f.key)
        )

        importStep.value = "mapping"

        toast.add({
          title: "字段分析完成",
          description: `识别到 ${sourceColumns.value.length} 个字段，自动匹配 ${Object.keys(suggestedMapping.value).length} 个`,
          color: "success"
        })
      } else {
        toast.add({
          title: "分析失败",
          description: response.message,
          color: "error"
        })
      }
    } catch (e: any) {
      toast.add({
        title: "分析失败",
        description: e.message || "请求失败",
        color: "error"
      })
    } finally {
      analyzing.value = false
    }
  }

  // 更新映射
  function updateMapping(sourceField: string, targetField: string) {
    if (targetField && targetField !== "_skip_") {
      customMapping.value[sourceField] = targetField
    } else {
      delete customMapping.value[sourceField]
    }

    // 重新计算缺失的必填字段
    const mappedTargets = Object.values(customMapping.value)
    missingRequiredFields.value = targetFields.value.filter(
      (f: any) => f.required && !mappedTargets.includes(f.key)
    )
  }

  // 获取映射置信度颜色
  function getConfidenceColor(sourceField: string) {
    const detail = matchDetails.value[sourceField]
    if (!detail) return "neutral"
    if (detail.confidence >= 0.9) return "success"
    if (detail.confidence >= 0.7) return "warning"
    return "error"
  }

  // 获取映射置信度文字
  function getConfidenceText(sourceField: string) {
    const detail = matchDetails.value[sourceField]
    if (!detail) return "未匹配"
    if (detail.confidence >= 0.9) return "高置信度"
    if (detail.confidence >= 0.7) return "中置信度"
    return "低置信度"
  }

  // 预览文件（使用自定义映射）
  async function previewFile() {
    if (!importFileContent.value) return

    const blob = new Blob([importFileContent.value], { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", blob, importFileName.value || "upload.csv")
    formData.append("dataSource", dataSourceKey.value)
    formData.append("action", "preview")
    formData.append("customMapping", JSON.stringify({ mapping: customMapping.value }))

    try {
      const response = (await $fetch("/api/esg/records.bulk", {
        method: "POST",
        body: formData
      })) as any

      if (response.success) {
        previewData.value = response.preview || []
        previewColumns.value = response.mappedColumns || []
        importStep.value = "preview"
        toast.add({
          title: "预览成功",
          description: `共 ${response.totalCount} 条数据`,
          color: "success"
        })
      } else {
        toast.add({
          title: "预览失败",
          description: response.message,
          color: "error"
        })
      }
    } catch (e: any) {
      toast.add({
        title: "预览失败",
        description: e.message,
        color: "error"
      })
    }
  }

  // 执行导入
  async function doImport() {
    if (!importFileContent.value) {
      toast.add({
        title: "请选择文件",
        color: "warning"
      })
      return
    }

    importing.value = true
    const blob = new Blob([importFileContent.value], { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", blob, importFileName.value || "upload.csv")
    formData.append("dataSource", dataSourceKey.value)
    formData.append("action", "import")
    formData.append("customMapping", JSON.stringify({ mapping: customMapping.value }))

    if (saveAsTemplate.value && newTemplateName.value) {
      formData.append("saveTemplate", "true")
      formData.append("templateName", newTemplateName.value)
      if (selectedSourceSystem.value) {
        formData.append("sourceSystem", selectedSourceSystem.value)
      }
    }

    try {
      const response = (await $fetch("/api/esg/records.bulk", {
        method: "POST",
        body: formData
      })) as any

      if (response.success) {
        toast.add({
          title: "导入成功",
          description: response.message,
          color: "success"
        })
        showImportModal.value = false
        fetchData()
      } else {
        toast.add({
          title: "导入失败",
          description: response.message,
          color: "error"
        })
      }
    } catch (e: any) {
      toast.add({
        title: "导入失败",
        description: e.message,
        color: "error"
      })
    } finally {
      importing.value = false
    }
  }

  // 下载模板
  async function downloadTemplate() {
    try {
      const response = (await $fetch(
        `/api/esg/records.export.template?dataSource=${dataSourceKey.value}`,
        {
          method: "GET",
          responseType: "blob"
        }
      )) as Blob

      const url = window.URL.createObjectURL(response)
      const a = document.createElement("a")
      a.href = url
      a.download = `${dataSourceKey.value}_template.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.add({
        title: "下载失败",
        description: e.message,
        color: "error"
      })
    }
  }

  // 初始化
  onMounted(() => {
    fetchData()
    // 检查是否需要打开导入模态框
    if (route.query.action === "import") {
      openImportModal()
    }
  })

  watch(
    () => route.params.key,
    () => {
      page.value = 1
      fetchData()
    }
  )
</script>

<template>
  <div class="p-6">
    <!-- 面包屑导航 -->
    <UBreadcrumb class="mb-4">
      <UBreadcrumbItem>
        <UButton variant="link" @click="router.push('/data-sources')">数据源管理</UButton>
      </UBreadcrumbItem>
      <UBreadcrumbItem>
        <span>{{ config.name }}</span>
      </UBreadcrumbItem>
    </UBreadcrumb>

    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div class="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg mr-4">
          <UIcon :name="config.icon" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ config.name }}</h1>
          <p class="text-sm text-gray-500">共 {{ totalCount }} 条记录</p>
        </div>
      </div>

      <div class="flex gap-2">
        <UButton icon="i-heroicons-arrow-down-tray" variant="soft" @click="downloadTemplate">
          下载模板
        </UButton>
        <!-- 导入按钮 -->
        <UButton icon="i-heroicons-arrow-up-tray" color="primary" @click="showImportModal = true">
          导入数据
        </UButton>
      </div>
    </div>

    <!-- 导入模态框 -->
    <UModal v-model:open="showImportModal" :ui="{ content: 'overflow-visible' }">
      <template #content>
        <UCard :ui="{ root: 'max-w-4xl w-[56rem] max-h-[90vh] overflow-y-auto' }">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">导入{{ config.name }}</span>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showImportModal = false"
              />
            </div>
          </template>

          <!-- 步骤指示器 -->
          <div class="flex items-center justify-center mb-6">
            <div class="flex items-center">
              <div
                :class="[
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  importStep === 'upload'
                    ? 'bg-primary-500 text-white'
                    : 'bg-primary-100 text-primary-600'
                ]"
              >
                1
              </div>
              <span class="ml-2 text-sm font-medium">上传文件</span>
            </div>
            <div class="w-12 h-0.5 bg-gray-200 mx-2"></div>
            <div class="flex items-center">
              <div
                :class="[
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  importStep === 'mapping'
                    ? 'bg-primary-500 text-white'
                    : importStep === 'preview'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-200 text-gray-500'
                ]"
              >
                2
              </div>
              <span class="ml-2 text-sm font-medium">字段映射</span>
            </div>
            <div class="w-12 h-0.5 bg-gray-200 mx-2"></div>
            <div class="flex items-center">
              <div
                :class="[
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  importStep === 'preview'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                ]"
              >
                3
              </div>
              <span class="ml-2 text-sm font-medium">预览确认</span>
            </div>
          </div>

          <!-- 步骤1: 上传文件 -->
          <div v-if="importStep === 'upload'" class="space-y-4">
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="flex items-start">
                <UIcon
                  name="i-heroicons-information-circle"
                  class="w-5 h-5 text-blue-600 mr-2 mt-0.5"
                />
                <div>
                  <p class="text-sm text-blue-800 dark:text-blue-200 font-medium">智能字段识别</p>
                  <p class="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    系统支持自动识别来自
                    SAP、用友、金蝶等企业系统导出的数据文件，无需严格按照模板格式
                  </p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="选择来源系统（可选）">
                <USelect
                  v-model="selectedSourceSystem"
                  :items="sourceSystemOptions"
                  placeholder="自动识别"
                />
              </UFormField>
              <UFormField label="或下载标准模板">
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-arrow-down-tray"
                  @click="downloadTemplate"
                >
                  下载模板
                </UButton>
              </UFormField>
            </div>

            <UFormField label="选择 CSV 文件" required>
              <input
                type="file"
                accept=".csv"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                @change="onFileChange"
              />
            </UFormField>

            <div
              v-if="importFileName"
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center"
            >
              <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-500 mr-2" />
              <span class="text-sm">{{ importFileName }}</span>
              <span class="text-xs text-gray-400 ml-2"
                >({{ (importFileContent.length / 1024).toFixed(1) }} KB)</span
              >
              <UIcon
                v-if="importFileContent"
                name="i-heroicons-check-circle"
                class="w-4 h-4 text-green-500 ml-2"
              />
              <div class="flex-1"></div>
              <UButton
                icon="i-heroicons-x-mark"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="clearFile"
              />
            </div>
          </div>

          <!-- 步骤2: 字段映射 -->
          <div v-if="importStep === 'mapping'" class="space-y-4">
            <!-- 警告信息 -->
            <div
              v-if="missingRequiredFields.length"
              class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
            >
              <div class="flex items-start">
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
                />
                <div>
                  <p class="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    缺少必填字段
                  </p>
                  <p class="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                    以下必填字段未映射：{{
                      missingRequiredFields.map((f: any) => f.label).join("、")
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 视图切换标签 -->
            <div class="flex items-center justify-between">
              <div class="flex gap-2">
                <UButton
                  :variant="!showDataComparison ? 'solid' : 'ghost'"
                  :color="!showDataComparison ? 'primary' : 'neutral'"
                  size="sm"
                  @click="showDataComparison = false"
                >
                  <UIcon name="i-heroicons-table-cells" class="w-4 h-4 mr-1" />
                  字段映射
                </UButton>
                <UButton
                  :variant="showDataComparison ? 'solid' : 'ghost'"
                  :color="showDataComparison ? 'primary' : 'neutral'"
                  size="sm"
                  @click="showDataComparison = true"
                >
                  <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 mr-1" />
                  数据对比预览
                </UButton>
              </div>
              <div class="text-sm text-gray-500">
                已匹配 {{ Object.keys(customMapping).filter((k) => customMapping[k]).length }} /
                {{ sourceColumns.length }} 个字段
              </div>
            </div>

            <!-- 字段映射视图 -->
            <div v-if="!showDataComparison" class="border rounded-lg overflow-hidden">
              <div
                class="bg-gray-50 dark:bg-gray-800 px-4 py-2 grid grid-cols-12 gap-4 text-sm font-medium text-gray-600"
              >
                <div class="col-span-4">源文件字段</div>
                <div class="col-span-1 text-center">→</div>
                <div class="col-span-4">系统字段</div>
                <div class="col-span-2">置信度</div>
                <div class="col-span-1">示例</div>
              </div>
              <div class="max-h-80 overflow-y-auto divide-y">
                <div
                  v-for="sourceField in sourceColumns"
                  :key="sourceField"
                  class="px-4 py-2 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div class="col-span-4">
                    <span class="font-mono text-sm">{{ sourceField }}</span>
                  </div>
                  <div class="col-span-1 text-center">
                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-400" />
                  </div>
                  <div class="col-span-4">
                    <USelect
                      :model-value="customMapping[sourceField] || '_skip_'"
                      :items="[
                        { value: '_skip_', label: '-- 不导入 --' },
                        ...targetFields.map((f: any) => ({
                          value: f.key,
                          label: `${f.label}${f.required ? ' *' : ''}`
                        }))
                      ]"
                      size="sm"
                      @update:model-value="(v: string) => updateMapping(sourceField, v)"
                    />
                  </div>
                  <div class="col-span-2">
                    <UBadge
                      v-if="matchDetails[sourceField]"
                      :color="getConfidenceColor(sourceField)"
                      variant="subtle"
                      size="xs"
                    >
                      {{ getConfidenceText(sourceField) }}
                    </UBadge>
                    <span v-else class="text-xs text-gray-400">手动</span>
                  </div>
                  <div class="col-span-1">
                    <span
                      class="text-xs text-gray-500 truncate block"
                      :title="sampleData[0]?.[sourceField]"
                    >
                      {{ sampleData[0]?.[sourceField] || "-" }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 数据对比预览视图 -->
            <div v-else class="space-y-4">
              <!-- 数据行导航 -->
              <div
                class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-eye" class="w-5 h-5 text-blue-600" />
                  <span class="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    数据转换预览 - 查看映射效果
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    icon="i-heroicons-chevron-left"
                    size="xs"
                    variant="soft"
                    :disabled="sampleData.length <= 1"
                    @click="prevComparisonRow"
                  />
                  <span class="text-sm text-gray-600 dark:text-gray-400 min-w-20 text-center">
                    第 {{ comparisonIndex + 1 }} / {{ sampleData.length }} 行
                  </span>
                  <UButton
                    icon="i-heroicons-chevron-right"
                    size="xs"
                    variant="soft"
                    :disabled="sampleData.length <= 1"
                    @click="nextComparisonRow"
                  />
                </div>
              </div>

              <!-- 对比卡片 -->
              <div class="grid grid-cols-2 gap-4">
                <!-- 原始数据 -->
                <div class="border rounded-lg overflow-hidden">
                  <div
                    class="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-sm flex items-center gap-2"
                  >
                    <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-gray-500" />
                    源文件数据
                  </div>
                  <div class="max-h-72 overflow-y-auto divide-y">
                    <div
                      v-for="sourceField in sourceColumns"
                      :key="sourceField"
                      class="px-4 py-2 flex justify-between items-center text-sm"
                      :class="
                        customMapping[sourceField]
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-gray-50 dark:bg-gray-800/50 opacity-50'
                      "
                    >
                      <span class="font-mono text-gray-600 dark:text-gray-400">{{
                        sourceField
                      }}</span>
                      <span
                        class="text-gray-900 dark:text-white truncate max-w-50"
                        :title="currentOriginalRow[sourceField]"
                      >
                        {{ currentOriginalRow[sourceField] ?? "-" }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 映射后数据 -->
                <div
                  class="border rounded-lg overflow-hidden border-primary-200 dark:border-primary-800"
                >
                  <div
                    class="bg-primary-50 dark:bg-primary-900/30 px-4 py-2 font-medium text-sm flex items-center gap-2 text-primary-700 dark:text-primary-300"
                  >
                    <UIcon name="i-heroicons-arrow-right-circle" class="w-4 h-4" />
                    映射后数据
                  </div>
                  <div class="max-h-72 overflow-y-auto divide-y">
                    <div
                      v-for="(item, idx) in mappingComparisonList"
                      :key="`mapped-${idx}-${item.targetField}`"
                      class="px-4 py-2 flex justify-between items-center text-sm bg-white dark:bg-gray-900"
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-primary-600 dark:text-primary-400">{{
                          item.targetLabel
                        }}</span>
                        <UBadge
                          v-if="item.confidence >= 0.9"
                          color="success"
                          variant="subtle"
                          size="xs"
                        >
                          自动
                        </UBadge>
                      </div>
                      <span
                        class="text-gray-900 dark:text-white truncate max-w-50"
                        :title="String(item.targetValue)"
                      >
                        {{ item.targetValue ?? "-" }}
                      </span>
                    </div>
                    <div
                      v-if="!mappingComparisonList.length"
                      class="px-4 py-8 text-center text-gray-400"
                    >
                      暂无映射字段
                    </div>
                  </div>
                </div>
              </div>

              <!-- 转换对照表 -->
              <div class="border rounded-lg overflow-hidden">
                <div class="bg-gray-50 dark:bg-gray-800 px-4 py-2 font-medium text-sm">
                  字段转换对照
                </div>
                <div class="max-h-48 overflow-y-auto">
                  <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          源字段
                        </th>
                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500"></th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          目标字段
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          原始值
                        </th>
                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500"></th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          转换后
                        </th>
                        <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          匹配方式
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr
                        v-for="(item, idx) in mappingComparisonList"
                        :key="`table-${idx}-${item.sourceField}`"
                        class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td class="px-4 py-2 font-mono text-gray-600 dark:text-gray-400">
                          {{ item.sourceField }}
                        </td>
                        <td class="px-4 py-2 text-center">
                          <UIcon
                            name="i-heroicons-arrow-long-right"
                            class="w-5 h-5 text-primary-500"
                          />
                        </td>
                        <td class="px-4 py-2 font-medium text-primary-600 dark:text-primary-400">
                          {{ item.targetLabel }}
                        </td>
                        <td
                          class="px-4 py-2 text-gray-500 truncate max-w-30"
                          :title="String(item.sourceValue)"
                        >
                          {{ item.sourceValue ?? "-" }}
                        </td>
                        <td class="px-4 py-2 text-center">
                          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-400" />
                        </td>
                        <td
                          class="px-4 py-2 text-gray-900 dark:text-white truncate max-w-30"
                          :title="String(item.targetValue)"
                        >
                          {{ item.targetValue ?? "-" }}
                        </td>
                        <td class="px-4 py-2 text-right">
                          <UBadge
                            :color="
                              item.confidence >= 0.9
                                ? 'success'
                                : item.confidence >= 0.7
                                  ? 'warning'
                                  : item.method === 'manual'
                                    ? 'neutral'
                                    : 'error'
                            "
                            variant="subtle"
                            size="xs"
                          >
                            {{
                              item.method === "template"
                                ? "模板"
                                : item.method === "exact"
                                  ? "精确"
                                  : item.method === "fuzzy"
                                    ? "模糊"
                                    : item.method === "alias"
                                      ? "别名"
                                      : "手动"
                            }}
                          </UBadge>
                        </td>
                      </tr>
                      <tr v-if="!mappingComparisonList.length">
                        <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                          暂无映射字段
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- 保存为模板 -->
            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UCheckbox v-model="saveAsTemplate" label="将此映射配置保存为模板，方便下次导入" />
              <div v-if="saveAsTemplate" class="mt-3 grid grid-cols-2 gap-4">
                <UInput v-model="newTemplateName" placeholder="模板名称，如：SAP HR 员工导出" />
                <USelect
                  v-model="selectedSourceSystem"
                  :items="sourceSystemOptions"
                  placeholder="来源系统"
                />
              </div>
            </div>
          </div>

          <!-- 步骤3: 预览数据 -->
          <div v-if="importStep === 'preview'" class="space-y-4">
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600 mr-2" />
              <span class="text-sm text-green-800 dark:text-green-200">
                字段映射完成，共识别 {{ previewData.length }} 条数据
              </span>
            </div>

            <div class="max-h-60 overflow-auto border rounded-lg">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th
                      v-for="col in previewColumns"
                      :key="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {{ targetFields.find((f: any) => f.key === col)?.label || col }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="(row, i) in previewData" :key="i">
                    <td
                      v-for="col in previewColumns"
                      :key="col"
                      class="px-3 py-2 whitespace-nowrap"
                    >
                      {{ row[col] ?? "-" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 保存为模板（如果之前没选择）-->
            <div v-if="!saveAsTemplate" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UCheckbox v-model="saveAsTemplate" label="将此映射配置保存为模板" />
              <div v-if="saveAsTemplate" class="mt-3 grid grid-cols-2 gap-4">
                <UInput v-model="newTemplateName" placeholder="模板名称" />
                <USelect
                  v-model="selectedSourceSystem"
                  :items="sourceSystemOptions"
                  placeholder="来源系统"
                />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-between w-full">
              <div>
                <UButton
                  v-if="importStep !== 'upload'"
                  variant="ghost"
                  @click="importStep = importStep === 'preview' ? 'mapping' : 'upload'"
                >
                  <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
                  上一步
                </UButton>
              </div>
              <div class="flex gap-2">
                <UButton variant="ghost" @click="showImportModal = false">取消</UButton>
                <UButton
                  v-if="importStep === 'upload'"
                  color="primary"
                  :disabled="!importFileContent"
                  :loading="analyzing"
                  @click="analyzeFile"
                >
                  分析文件
                  <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
                </UButton>
                <UButton
                  v-if="importStep === 'mapping'"
                  color="primary"
                  :disabled="missingRequiredFields.length > 0"
                  @click="previewFile"
                >
                  预览数据
                  <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
                </UButton>
                <UButton
                  v-if="importStep === 'preview'"
                  color="primary"
                  :loading="importing"
                  @click="doImport"
                >
                  确认导入
                </UButton>
              </div>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- 数据表格 -->
    <UCard>
      <UTable :columns="tableColumns" :data="data" :loading="loading">
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12">
            <UIcon name="i-heroicons-circle-stack" class="w-10 h-10 text-gray-400 mb-4" />
            <p class="text-gray-500 mb-4">暂无数据</p>
            <UButton @click="showImportModal = true">导入数据</UButton>
          </div>
        </template>
      </UTable>

      <!-- 分页 -->
      <template #footer v-if="totalCount > pageSize">
        <div class="flex justify-center">
          <UPagination
            v-model="page"
            :page-count="pageSize"
            :total="totalCount"
            @update:model-value="fetchData"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
