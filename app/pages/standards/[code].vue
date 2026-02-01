<script setup lang="ts">
  definePageMeta({
    layout: "default"
  })

  const route = useRoute()
  const toast = useToast()
  const code = route.params.code as string

  // 获取标准详情
  const { data: standard, pending, error } = await useFetch(`/api/standards/${code}`)

  // 当前激活的 Tab
  const activeTab = ref("metrics")

  // 指标筛选
  const metricSearch = ref("")
  const selectedDimension = ref<string>("")

  const dimensionOptions = [
    { label: "全部维度", value: "" },
    { label: "🌱 环境 (E)", value: "E" },
    { label: "👥 社会 (S)", value: "S" },
    { label: "🏛️ 治理 (G)", value: "G" },
    { label: "📋 通用", value: "general" }
  ]

  // 筛选后的指标
  const filteredMetrics = computed(() => {
    if (!standard.value?.metrics) return []

    return standard.value.metrics.filter((m: any) => {
      // 搜索筛选
      if (metricSearch.value) {
        const search = metricSearch.value.toLowerCase()
        if (
          !m.code.toLowerCase().includes(search) &&
          !m.name.toLowerCase().includes(search) &&
          !(m.nameEn || "").toLowerCase().includes(search)
        ) {
          return false
        }
      }

      // 维度筛选 (通过主题关联)
      if (selectedDimension.value && m.topicCode) {
        const topic = standard.value?.topics?.find(
          (t: any) => t.code === m.topicCode || hasChildWithCode(t, m.topicCode)
        )
        if (topic && topic.dimension !== selectedDimension.value) {
          return false
        }
      }

      return true
    })
  })

  function hasChildWithCode(topic: any, code: string): boolean {
    if (topic.code === code) return true
    return topic.children?.some((c: any) => hasChildWithCode(c, code)) || false
  }

  // 获取披露级别颜色
  function getDisclosureLevelColor(level: string) {
    const colors: Record<string, string> = {
      mandatory: "error",
      comply_or_explain: "warning",
      voluntary: "success",
      recommended: "info"
    }
    return colors[level] || "neutral"
  }

  function getDisclosureLevelLabel(level: string) {
    const labels: Record<string, string> = {
      mandatory: "强制",
      comply_or_explain: "遵守或解释",
      voluntary: "自愿",
      recommended: "建议"
    }
    return labels[level] || level
  }

  // 获取数据类型标签
  function getDataTypeLabel(type: string) {
    const labels: Record<string, string> = {
      quantitative: "定量",
      qualitative: "定性",
      both: "定量+定性"
    }
    return labels[type] || type
  }

  // 地区标签
  function getRegionLabels(regions: string[]) {
    const labels: Record<string, string> = {
      global: "🌍 全球",
      CN: "🇨🇳 中国",
      EU: "🇪🇺 欧盟",
      US: "🇺🇸 美国"
    }
    return regions.map((r) => labels[r] || r)
  }
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- 面包屑 -->
    <UBreadcrumb :links="[{ label: '标准管理', to: '/standards' }, { label: code }]" class="mb-6" />

    <!-- 加载状态 -->
    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-32 rounded-xl" />
      <USkeleton class="h-96 rounded-xl" />
    </div>

    <!-- 错误状态 -->
    <UCard v-else-if="error" class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto text-red-500" />
      <p class="mt-4 text-gray-600">加载标准详情失败</p>
      <UButton class="mt-4" @click="navigateTo('/standards')">返回列表</UButton>
    </UCard>

    <!-- 标准详情 -->
    <template v-else-if="standard">
      <!-- 标准头部信息 -->
      <UCard class="mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ standard.code }}
              </h1>
              <UBadge :color="standard.status === 'active' ? 'success' : 'warning'">
                {{ standard.status === "active" ? "生效中" : standard.status }}
              </UBadge>
            </div>

            <p class="text-lg text-gray-700 dark:text-gray-300">{{ standard.name }}</p>
            <p v-if="standard.nameEn" class="text-gray-500">{{ standard.nameEn }}</p>

            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ standard.description }}
            </p>

            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="region in getRegionLabels(standard.applicableRegions || [])"
                :key="region"
                variant="subtle"
              >
                {{ region }}
              </UBadge>
            </div>
          </div>

          <div class="lg:text-right space-y-2 text-sm text-gray-500">
            <p><span class="font-medium">发布机构:</span> {{ standard.issuer }}</p>
            <p v-if="standard.version">
              <span class="font-medium">版本:</span> {{ standard.version }}
            </p>
            <p v-if="standard.effectiveDate">
              <span class="font-medium">生效日期:</span> {{ standard.effectiveDate }}
            </p>
            <p v-if="standard.officialUrl">
              <UButton
                variant="link"
                size="xs"
                :to="standard.officialUrl"
                target="_blank"
                trailing-icon="i-heroicons-arrow-top-right-on-square"
              >
                官方网站
              </UButton>
            </p>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800"
        >
          <div class="text-center">
            <p class="text-3xl font-bold text-primary-600">
              {{ standard.statistics?.totalTopics || 0 }}
            </p>
            <p class="text-sm text-gray-500">主题分类</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-emerald-600">
              {{ standard.statistics?.totalMetrics || 0 }}
            </p>
            <p class="text-sm text-gray-500">披露指标</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-red-600">
              {{ standard.statistics?.mandatoryMetrics || 0 }}
            </p>
            <p class="text-sm text-gray-500">强制指标</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-amber-600">
              {{ standard.statistics?.voluntaryMetrics || 0 }}
            </p>
            <p class="text-sm text-gray-500">自愿指标</p>
          </div>
        </div>
      </UCard>

      <!-- Tab 切换 -->
      <UTabs
        v-model="activeTab"
        :items="[
          { label: '披露指标', slot: 'metrics', icon: 'i-heroicons-table-cells' },
          { label: '主题结构', slot: 'topics', icon: 'i-heroicons-rectangle-stack' },
          { label: '指标映射', slot: 'mappings', icon: 'i-heroicons-arrows-right-left' }
        ]"
        class="w-full"
      >
        <!-- 披露指标 Tab -->
        <template #metrics>
          <UCard class="mt-4">
            <!-- 筛选栏 -->
            <div class="flex flex-wrap gap-4 mb-4">
              <UInput
                v-model="metricSearch"
                placeholder="搜索指标代码或名称..."
                icon="i-heroicons-magnifying-glass"
                class="w-64"
              />
              <USelectMenu
                v-model="selectedDimension"
                :options="dimensionOptions"
                value-attribute="value"
                option-attribute="label"
                class="w-40"
              />
            </div>

            <!-- 指标表格 -->
            <UTable
              :rows="filteredMetrics"
              :columns="[
                { key: 'code', label: '指标代码', sortable: true },
                { key: 'name', label: '指标名称' },
                { key: 'disclosureLevel', label: '披露级别' },
                { key: 'dataType', label: '数据类型' },
                { key: 'unit', label: '单位' },
                { key: 'frequency', label: '频率' }
              ]"
              :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: '暂无指标数据' }"
            >
              <template #code-data="{ row }">
                <span class="font-mono text-sm">{{ row.code }}</span>
              </template>

              <template #name-data="{ row }">
                <div>
                  <p class="font-medium">{{ row.name }}</p>
                  <p v-if="row.nameEn" class="text-xs text-gray-500">{{ row.nameEn }}</p>
                </div>
              </template>

              <template #disclosureLevel-data="{ row }">
                <UBadge :color="getDisclosureLevelColor(row.disclosureLevel)" size="xs">
                  {{ getDisclosureLevelLabel(row.disclosureLevel) }}
                </UBadge>
              </template>

              <template #dataType-data="{ row }">
                <span class="text-sm">{{ getDataTypeLabel(row.dataType) }}</span>
              </template>

              <template #unit-data="{ row }">
                <span class="text-sm text-gray-600">{{ row.unit || "-" }}</span>
              </template>

              <template #frequency-data="{ row }">
                <span class="text-sm">{{
                  row.frequency === "annual" ? "年度" : row.frequency
                }}</span>
              </template>
            </UTable>
          </UCard>
        </template>

        <!-- 主题结构 Tab -->
        <template #topics>
          <UCard class="mt-4">
            <div v-if="standard.topics?.length" class="space-y-4">
              <div
                v-for="topic in standard.topics"
                :key="topic.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div class="flex items-center gap-3 mb-2">
                  <UBadge
                    :color="
                      topic.dimension === 'E'
                        ? 'success'
                        : topic.dimension === 'S'
                          ? 'info'
                          : topic.dimension === 'G'
                            ? 'warning'
                            : 'neutral'
                    "
                    size="sm"
                  >
                    {{ topic.dimension || "General" }}
                  </UBadge>
                  <span class="font-mono text-sm text-gray-500">{{ topic.code }}</span>
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ topic.name }}</h4>
                <p v-if="topic.nameEn" class="text-sm text-gray-500">{{ topic.nameEn }}</p>

                <!-- 子主题 -->
                <div v-if="topic.children?.length" class="mt-3 ml-4 space-y-2">
                  <div
                    v-for="child in topic.children"
                    :key="child.id"
                    class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <span class="font-mono text-xs text-gray-400">{{ child.code }}</span>
                    <span>{{ child.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">暂无主题结构数据</div>
          </UCard>
        </template>

        <!-- 指标映射 Tab -->
        <template #mappings>
          <UCard class="mt-4">
            <div class="text-center py-12">
              <UIcon name="i-heroicons-arrows-right-left" class="w-12 h-12 mx-auto text-gray-400" />
              <h3 class="mt-4 font-medium text-gray-900 dark:text-white">配置指标映射</h3>
              <p class="mt-2 text-sm text-gray-500">
                将本地 ESG 指标与 {{ standard.code }} 标准指标建立映射关系
              </p>
              <UButton
                class="mt-4"
                @click="navigateTo(`/standards/mappings?standardCode=${standard.code}`)"
              >
                配置映射
              </UButton>
            </div>
          </UCard>
        </template>
      </UTabs>
    </template>
  </div>
</template>
