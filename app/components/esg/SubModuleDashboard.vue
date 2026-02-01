<template>
  <div class="space-y-6">
    <!-- 头部统计 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard v-for="stat in stats" :key="stat.label" class="shadow-lg shadow-emerald-500/10">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="stat.bgClass">
            <UIcon :name="stat.icon" class="text-2xl" :class="stat.iconClass" />
          </div>
          <div>
            <p class="text-sm text-emerald-600 dark:text-emerald-400">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-emerald-800 dark:text-emerald-100">
              {{ stat.value }}
              <span v-if="stat.unit" class="text-sm font-normal text-emerald-500">
                {{ stat.unit }}
              </span>
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 工具栏 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- 周期筛选 -->
        <USelect
          v-model="selectedPeriod"
          :items="periodOptions"
          placeholder="选择周期"
          class="w-32"
        />
        <!-- 状态筛选 -->
        <USelect
          v-model="selectedStatus"
          :items="statusOptions"
          placeholder="全部状态"
          class="w-32"
        />
      </div>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="outline" @click="exportData">
          <UIcon name="i-heroicons-arrow-down-tray" class="mr-2" />
          导出
        </UButton>
        <UButton color="primary" @click="emit('add')">
          <UIcon name="i-heroicons-plus" class="mr-2" />
          录入数据
        </UButton>
      </div>
    </div>

    <!-- 数据表格 -->
    <UCard class="shadow-lg shadow-emerald-500/10">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-emerald-800 dark:text-emerald-100">
            {{ subModule?.name || "指标数据" }}
          </h3>
          <UButton color="neutral" variant="ghost" size="sm" @click="refresh" :loading="loading">
            <UIcon name="i-heroicons-arrow-path" />
          </UButton>
        </div>
      </template>

      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="text-4xl text-emerald-500 animate-spin" />
      </div>

      <div v-else-if="tableData.length === 0" class="text-center py-12">
        <UIcon
          name="i-heroicons-inbox"
          class="text-6xl text-emerald-300 dark:text-emerald-700 mx-auto mb-4"
        />
        <p class="text-emerald-600 dark:text-emerald-400">暂无数据</p>
        <UButton color="primary" variant="soft" class="mt-4" @click="emit('add')">
          开始录入
        </UButton>
      </div>

      <UTable v-else :data="tableData" :columns="columns">
        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.status)" variant="soft">
            {{ getStatusLabel(row.status) }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1">
            <UButton color="neutral" variant="ghost" size="xs" @click="viewRecord(row)">
              <UIcon name="i-heroicons-eye" />
            </UButton>
            <UButton color="neutral" variant="ghost" size="xs" @click="editRecord(row)">
              <UIcon name="i-heroicons-pencil" />
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- 分类数据卡片 -->
    <div v-if="!loading && categories.length > 0" class="space-y-6">
      <template v-for="category in categories" :key="category.id">
        <UCard class="shadow-lg shadow-emerald-500/10">
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
              >
                <UIcon name="i-heroicons-chart-bar" class="text-white text-sm" />
              </div>
              <h3 class="font-semibold text-emerald-800 dark:text-emerald-100">
                {{ category.code }} {{ category.name }}
              </h3>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <template v-for="metric in getCategoryMetrics(category)" :key="metric.id">
              <div class="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                <p class="text-xs text-emerald-500 mb-1">{{ metric.code }}</p>
                <p class="text-sm font-medium text-emerald-700 dark:text-emerald-200 mb-2">
                  {{ metric.name }}
                </p>
                <p class="text-xl font-bold text-emerald-800 dark:text-emerald-100">
                  {{ getMetricValue(metric.code) || "-" }}
                  <span
                    v-if="metric.fieldConfig?.unit"
                    class="text-sm font-normal text-emerald-500"
                  >
                    {{ metric.fieldConfig.unit }}
                  </span>
                </p>
              </div>
            </template>
          </div>
        </UCard>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface MetricConfig {
    unit?: string
    options?: Array<{ label: string; value: string }>
  }

  interface Metric {
    id: number
    code: string
    name: string
    fieldType: string
    fieldConfig: MetricConfig | null
  }

  interface Category {
    id: number
    code: string
    name: string
    metrics?: Metric[]
    children?: Category[]
  }

  interface SubModule {
    id: number
    code: string
    name: string
    description?: string
    categories: Category[]
  }

  interface Record {
    id: number
    metricId: number
    period: string
    status: string
    valueNumber: number | null
    valueText: string | null
    valueJson: any
    metric: Metric | null
  }

  const props = defineProps<{
    subModuleCode: string
  }>()

  const emit = defineEmits<{
    (e: "add"): void
    (e: "edit", record: Record): void
    (e: "view", record: Record): void
  }>()

  // 状态
  const loading = ref(true)
  const subModule = ref<SubModule | null>(null)
  const categories = ref<Category[]>([])
  const records = ref<Record[]>([])
  const recordsMap = ref<Map<string, Record>>(new Map())

  // 筛选
  const currentYear = new Date().getFullYear()
  const periodOptions = [
    { label: "全部周期", value: null },
    { label: `${currentYear}年`, value: String(currentYear) },
    { label: `${currentYear - 1}年`, value: String(currentYear - 1) }
  ]
  const selectedPeriod = ref(String(currentYear))

  const statusOptions = [
    { label: "全部状态", value: null },
    { label: "草稿", value: "draft" },
    { label: "已提交", value: "submitted" },
    { label: "已审核", value: "approved" }
  ]
  const selectedStatus = ref(null)

  // 统计数据
  const stats = computed(() => [
    {
      label: "指标总数",
      value: getAllMetrics().length,
      icon: "i-heroicons-chart-bar",
      bgClass: "bg-emerald-100 dark:bg-emerald-900/50",
      iconClass: "text-emerald-600 dark:text-emerald-400"
    },
    {
      label: "已填报",
      value: records.value.filter((r) => r.status !== "draft").length,
      icon: "i-heroicons-check-circle",
      bgClass: "bg-green-100 dark:bg-green-900/50",
      iconClass: "text-green-600 dark:text-green-400"
    },
    {
      label: "待审核",
      value: records.value.filter((r) => r.status === "submitted").length,
      icon: "i-heroicons-clock",
      bgClass: "bg-amber-100 dark:bg-amber-900/50",
      iconClass: "text-amber-600 dark:text-amber-400"
    },
    {
      label: "完成率",
      value:
        getAllMetrics().length > 0
          ? Math.round((records.value.length / getAllMetrics().length) * 100)
          : 0,
      unit: "%",
      icon: "i-heroicons-chart-pie",
      bgClass: "bg-teal-100 dark:bg-teal-900/50",
      iconClass: "text-teal-600 dark:text-teal-400"
    }
  ])

  // 表格列
  const columns = [
    { key: "metric.code", label: "指标编号" },
    { key: "metric.name", label: "指标名称" },
    { key: "period", label: "周期" },
    { key: "value", label: "数值" },
    { key: "status", label: "状态" },
    { key: "actions", label: "操作" }
  ]

  // 表格数据
  const tableData = computed(() => {
    return records.value
      .filter((r) => selectedStatus.value === null || r.status === selectedStatus.value)
      .map((r) => ({
        ...r,
        value: r.valueNumber ?? r.valueText ?? "-"
      }))
  })

  // 获取所有指标
  const getAllMetrics = (): Metric[] => {
    const metrics: Metric[] = []
    const processCategory = (category: Category) => {
      if (category.metrics) {
        metrics.push(...category.metrics)
      }
      category.children?.forEach(processCategory)
    }
    categories.value.forEach(processCategory)
    return metrics
  }

  // 获取分类指标
  const getCategoryMetrics = (category: Category): Metric[] => {
    const metrics: Metric[] = []
    if (category.metrics) {
      metrics.push(...category.metrics)
    }
    category.children?.forEach((child) => {
      if (child.metrics) {
        metrics.push(...child.metrics)
      }
    })
    return metrics.slice(0, 6) // 限制显示数量
  }

  // 获取指标值
  const getMetricValue = (metricCode: string): string | number | null => {
    const record = recordsMap.value.get(metricCode)
    if (!record) return null
    return record.valueNumber ?? record.valueText ?? null
  }

  // 状态相关
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "neutral",
      submitted: "warning",
      approved: "success",
      rejected: "error"
    }
    return colors[status] || "neutral"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "草稿",
      submitted: "待审核",
      approved: "已审核",
      rejected: "已退回"
    }
    return labels[status] || status
  }

  // 操作
  const viewRecord = (record: Record) => {
    emit("view", record)
  }

  const editRecord = (record: Record) => {
    emit("edit", record)
  }

  const exportData = async () => {
    try {
      const { data, error } = await useFetch("/api/esg/records/export", {
        method: "POST",
        body: {
          subModuleCode: props.subModuleCode,
          period: selectedPeriod.value || undefined,
          status: selectedStatus.value || undefined
        }
      })

      if (error.value) {
        throw error.value
      }

      // 检查是否有数据
      const result = data.value as any
      if (result?.data?.url) {
        // 创建下载链接
        const link = document.createElement("a")
        link.href = result.data.url
        link.download = `ESG数据_${props.subModuleCode}_${new Date().getTime()}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.add({
          title: "导出成功",
          color: "success"
        })
      } else if (result?.message) {
        toast.add({
          title: result.message,
          color: "warning"
        })
      }
    } catch (e: any) {
      toast.add({
        title: "导出失败",
        description: e.data?.message || e.message,
        color: "error"
      })
    }
  }

  // 数据加载
  const fetchSchema = async () => {
    try {
      const { data } = await useFetch(`/api/esg/schema?subModule=${props.subModuleCode}`)
      if (data.value?.success && data.value.data) {
        const responseData = data.value.data as any

        // 处理不同的返回格式
        let foundSubModule = null

        if (Array.isArray(responseData)) {
          // 返回数组格式：遍历所有模块找到对应的子模块
          for (const module of responseData) {
            if (module.subModules?.length) {
              const found = module.subModules.find((s: any) => s.code === props.subModuleCode)
              if (found) {
                foundSubModule = found
                break
              }
            }
          }
        } else if (responseData.subModules?.length) {
          // 返回单个模块对象
          foundSubModule =
            responseData.subModules.find((s: any) => s.code === props.subModuleCode) ||
            responseData.subModules[0]
        } else if (responseData.categories) {
          // 直接返回子模块对象
          foundSubModule = responseData
        }

        if (foundSubModule) {
          subModule.value = foundSubModule
          categories.value = foundSubModule.categories || []
        }
      }
    } catch (e) {
      console.error("获取 Schema 失败", e)
    }
  }

  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams({
        subModule: props.subModuleCode
      })
      if (selectedPeriod.value) {
        params.append("period", selectedPeriod.value)
      }

      const { data } = await useFetch(`/api/esg/records?${params.toString()}`)
      if (data.value?.success) {
        records.value = data.value.data as Record[]

        // 构建映射
        recordsMap.value.clear()
        records.value.forEach((r) => {
          if (r.metric?.code) {
            recordsMap.value.set(r.metric.code, r)
          }
        })
      }
    } catch (e) {
      console.error("获取记录失败", e)
    }
  }

  const refresh = async () => {
    loading.value = true
    await Promise.all([fetchSchema(), fetchRecords()])
    loading.value = false
  }

  // 监听筛选变化
  watch([selectedPeriod, selectedStatus], () => {
    fetchRecords()
  })

  // 初始化
  onMounted(() => {
    refresh()
  })
</script>
