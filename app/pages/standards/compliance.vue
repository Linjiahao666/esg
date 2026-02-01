<script setup lang="ts">
  definePageMeta({
    layout: "default"
  })

  const route = useRoute()
  const toast = useToast()

  // 参数
  const period = ref(new Date().getFullYear().toString())
  const selectedStandard = ref("")

  // 获取企业标准配置
  const { data: companyConfigs, refresh: refreshConfigs } = await useFetch(
    "/api/standards/company-configs"
  )

  // 获取标准列表
  const { data: standards } = await useFetch("/api/standards")

  // 获取合规追踪数据
  const {
    data: complianceData,
    pending: loadingCompliance,
    refresh: refreshCompliance
  } = await useFetch("/api/standards/compliance", {
    query: computed(() => ({
      standardCode: selectedStandard.value,
      period: period.value
    })),
    watch: [selectedStandard, period],
    immediate: false
  })

  // 标准选项
  const standardOptions = computed(() => {
    if (!standards.value) return []
    return standards.value.map((s: any) => ({
      label: `${s.code} - ${s.name}`,
      value: s.code
    }))
  })

  // 周期选项
  const periodOptions = [
    { label: "2026", value: "2026" },
    { label: "2025", value: "2025" },
    { label: "2024", value: "2024" },
    { label: "2023", value: "2023" }
  ]

  // 监听标准选择
  watch(selectedStandard, (val) => {
    if (val) {
      refreshCompliance()
    }
  })

  // 获取状态颜色
  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      completed: "success",
      in_progress: "warning",
      not_started: "neutral",
      not_mapped: "error"
    }
    return colors[status] || "neutral"
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      completed: "已完成",
      in_progress: "进行中",
      not_started: "未开始",
      not_mapped: "未映射"
    }
    return labels[status] || status
  }

  // 采用标准
  const showAdoptModal = ref(false)
  const adoptingStandard = ref<any>(null)

  function openAdoptModal(standard: any) {
    adoptingStandard.value = standard
    showAdoptModal.value = true
  }

  async function adoptStandard() {
    if (!adoptingStandard.value) return

    try {
      await $fetch("/api/standards/company-configs", {
        method: "POST",
        body: {
          standardCode: adoptingStandard.value.code,
          adoptionStatus: "planning",
          targetComplianceYear: new Date().getFullYear() + 1
        }
      })
      toast.add({ title: "标准采用成功", color: "success" })
      showAdoptModal.value = false
      refreshConfigs()
    } catch (error: any) {
      toast.add({ title: "操作失败", description: error.message, color: "error" })
    }
  }

  // 计算饼图数据
  const complianceChart = computed(() => {
    if (!complianceData.value?.statistics) return null
    const stats = complianceData.value.statistics
    return {
      completed: stats.completed,
      inProgress: stats.inProgress,
      notStarted: stats.notStarted,
      notMapped: stats.notMapped
    }
  })
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- 面包屑 -->
    <UBreadcrumb
      :links="[{ label: '标准管理', to: '/standards' }, { label: '合规追踪' }]"
      class="mb-6"
    />

    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">标准合规追踪</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">追踪企业对各国际标准的合规完成情况</p>
    </div>

    <!-- 企业已采用的标准 -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">已采用的标准</h3>
          <UButton size="sm" icon="i-heroicons-plus" @click="navigateTo('/standards')">
            添加标准
          </UButton>
        </div>
      </template>

      <div
        v-if="companyConfigs?.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="config in companyConfigs"
          :key="config.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer"
          :class="{ 'ring-2 ring-primary-500': selectedStandard === config.standard.code }"
          @click="selectedStandard = config.standard.code"
        >
          <div class="flex items-start justify-between mb-2">
            <div>
              <h4 class="font-semibold">{{ config.standard.code }}</h4>
              <p class="text-sm text-gray-500">{{ config.standard.name }}</p>
            </div>
            <UBadge v-if="config.isPrimary" color="primary" size="xs">主要</UBadge>
          </div>

          <div class="mt-3 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">采用状态:</span>
              <UBadge
                :color="config.adoptionStatus === 'compliant' ? 'success' : 'warning'"
                size="xs"
                variant="subtle"
              >
                {{
                  config.adoptionStatus === "planning"
                    ? "计划中"
                    : config.adoptionStatus === "implementing"
                      ? "实施中"
                      : config.adoptionStatus === "compliant"
                        ? "已合规"
                        : config.adoptionStatus
                }}
              </UBadge>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">合规率:</span>
              <span class="font-medium">{{ config.complianceRate || 0 }}%</span>
            </div>
            <div v-if="config.targetComplianceYear" class="flex justify-between">
              <span class="text-gray-500">目标年份:</span>
              <span>{{ config.targetComplianceYear }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <UIcon name="i-heroicons-document-plus" class="w-10 h-10 mx-auto text-gray-400" />
        <p class="mt-2 text-gray-500">尚未采用任何标准</p>
        <UButton class="mt-3" variant="soft" @click="navigateTo('/standards')">
          浏览可用标准
        </UButton>
      </div>
    </UCard>

    <!-- 合规详情 -->
    <template v-if="selectedStandard">
      <!-- 筛选栏 -->
      <div class="flex items-center gap-4 mb-4">
        <UFormGroup label="报告周期">
          <USelectMenu
            v-model="period"
            :options="periodOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-32"
          />
        </UFormGroup>
        <div class="flex-1" />
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          :loading="loadingCompliance"
          @click="refreshCompliance()"
        >
          刷新
        </UButton>
      </div>

      <!-- 加载状态 -->
      <div v-if="loadingCompliance" class="space-y-4">
        <USkeleton class="h-32" />
        <USkeleton class="h-96" />
      </div>

      <!-- 合规数据 -->
      <template v-else-if="complianceData">
        <!-- 统计卡片 -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-primary-600">
                {{ complianceData.statistics.overallComplianceRate }}%
              </p>
              <p class="text-sm text-gray-500">总体合规率</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-red-600">
                {{ complianceData.statistics.mandatoryComplianceRate }}%
              </p>
              <p class="text-sm text-gray-500">强制指标合规率</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-emerald-600">
                {{ complianceData.statistics.completed }}
              </p>
              <p class="text-sm text-gray-500">已完成</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-amber-600">
                {{ complianceData.statistics.inProgress }}
              </p>
              <p class="text-sm text-gray-500">进行中</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-gray-600">
                {{ complianceData.statistics.notMapped }}
              </p>
              <p class="text-sm text-gray-500">未映射</p>
            </div>
          </UCard>
        </div>

        <!-- 指标完成明细 -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">指标完成明细</h3>
          </template>

          <UTable
            :rows="complianceData.items"
            :columns="[
              { key: 'standardMetric', label: '标准指标' },
              { key: 'disclosureLevel', label: '披露级别' },
              { key: 'mapping', label: '本地映射' },
              { key: 'status', label: '完成状态' },
              { key: 'localValue', label: '当前值' },
              { key: 'dataQuality', label: '数据质量' }
            ]"
          >
            <template #standardMetric-data="{ row }">
              <div>
                <p class="font-mono text-sm">{{ row.standardMetric.code }}</p>
                <p class="text-xs text-gray-500">{{ row.standardMetric.name }}</p>
              </div>
            </template>

            <template #disclosureLevel-data="{ row }">
              <UBadge
                :color="row.standardMetric.disclosureLevel === 'mandatory' ? 'error' : 'warning'"
                size="xs"
              >
                {{ row.standardMetric.disclosureLevel === "mandatory" ? "强制" : "自愿" }}
              </UBadge>
            </template>

            <template #mapping-data="{ row }">
              <template v-if="row.mapping">
                <p class="font-mono text-sm">{{ row.mapping.localMetricCode }}</p>
                <UBadge size="xs" variant="subtle"> {{ row.mapping.confidence }}% 置信度 </UBadge>
              </template>
              <span v-else class="text-gray-400">-</span>
            </template>

            <template #status-data="{ row }">
              <UBadge :color="getStatusColor(row.compliance.status)">
                {{ getStatusLabel(row.compliance.status) }}
              </UBadge>
            </template>

            <template #localValue-data="{ row }">
              <span v-if="row.compliance.localValue !== null">
                {{ row.compliance.localValue }}
                <span v-if="row.standardMetric.unit" class="text-gray-500 text-xs">
                  {{ row.standardMetric.unit }}
                </span>
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>

            <template #dataQuality-data="{ row }">
              <UBadge
                v-if="row.compliance.dataQuality"
                :color="
                  row.compliance.dataQuality === 'high'
                    ? 'success'
                    : row.compliance.dataQuality === 'medium'
                      ? 'warning'
                      : 'error'
                "
                variant="subtle"
                size="xs"
              >
                {{
                  row.compliance.dataQuality === "high"
                    ? "高"
                    : row.compliance.dataQuality === "medium"
                      ? "中"
                      : "低"
                }}
              </UBadge>
              <span v-else class="text-gray-400">-</span>
            </template>
          </UTable>
        </UCard>
      </template>
    </template>

    <!-- 未选择标准提示 -->
    <UCard v-else class="text-center py-12">
      <UIcon name="i-heroicons-cursor-arrow-rays" class="w-12 h-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-500">请选择一个标准查看合规追踪详情</p>
    </UCard>
  </div>
</template>
