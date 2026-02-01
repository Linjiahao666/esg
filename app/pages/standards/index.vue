<script setup lang="ts">
  definePageMeta({
    layout: "default"
  })

  const toast = useToast()

  // 获取标准列表
  const {
    data: standards,
    pending,
    refresh
  } = await useFetch("/api/standards", {
    query: { includeMetrics: "true" }
  })

  // 筛选条件
  const selectedRegion = ref<string>("")
  const selectedType = ref<string>("")

  const regionOptions = [
    { label: "全部地区", value: "" },
    { label: "🌍 全球通用", value: "global" },
    { label: "🇨🇳 中国", value: "CN" },
    { label: "🇪🇺 欧盟", value: "EU" },
    { label: "🇺🇸 美国", value: "US" }
  ]

  const typeOptions = [
    { label: "全部类型", value: "" },
    { label: "框架标准", value: "framework" },
    { label: "法规要求", value: "regulation" },
    { label: "指南建议", value: "guideline" }
  ]

  // 筛选后的标准
  const filteredStandards = computed(() => {
    if (!standards.value) return []

    return standards.value.filter((s: any) => {
      // 地区筛选
      if (selectedRegion.value) {
        const regions = s.applicableRegions || []
        if (!regions.includes(selectedRegion.value) && !regions.includes("global")) {
          return false
        }
      }

      // 类型筛选
      if (selectedType.value && s.standardType !== selectedType.value) {
        return false
      }

      return true
    })
  })

  // 获取地区标签
  function getRegionLabels(regions: string[]) {
    const labels: Record<string, string> = {
      global: "🌍 全球",
      CN: "🇨🇳 中国",
      EU: "🇪🇺 欧盟",
      US: "🇺🇸 美国"
    }
    return regions.map((r) => labels[r] || r)
  }

  // 获取类型标签颜色
  function getTypeColor(type: string) {
    const colors: Record<string, string> = {
      framework: "primary",
      regulation: "error",
      guideline: "warning"
    }
    return colors[type] || "neutral"
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      framework: "框架",
      regulation: "法规",
      guideline: "指南"
    }
    return labels[type] || type
  }

  // 获取状态颜色
  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      active: "success",
      draft: "warning",
      superseded: "neutral"
    }
    return colors[status] || "neutral"
  }
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">国际标准管理</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        管理和配置企业适用的 ESG 披露标准，支持 GRI、CSRD、SEC、上交所/深交所等主流标准
      </p>
    </div>

    <!-- 筛选栏 -->
    <div class="mb-6 flex flex-wrap gap-4 items-center">
      <USelectMenu
        v-model="selectedRegion"
        :options="regionOptions"
        value-attribute="value"
        option-attribute="label"
        placeholder="选择地区"
        class="w-40"
      />
      <USelectMenu
        v-model="selectedType"
        :options="typeOptions"
        value-attribute="value"
        option-attribute="label"
        placeholder="选择类型"
        class="w-40"
      />
      <div class="flex-1" />
      <UButton icon="i-heroicons-arrow-path" variant="ghost" :loading="pending" @click="refresh()">
        刷新
      </UButton>
    </div>

    <!-- 标准卡片列表 -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <USkeleton v-for="i in 6" :key="i" class="h-64 rounded-xl" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="standard in filteredStandards"
        :key="standard.code"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateTo(`/standards/${standard.code}`)"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <UBadge :color="getTypeColor(standard.standardType)" size="xs">
                  {{ getTypeLabel(standard.standardType) }}
                </UBadge>
                <UBadge :color="getStatusColor(standard.status)" variant="subtle" size="xs">
                  {{ standard.status === "active" ? "生效中" : standard.status }}
                </UBadge>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ standard.code }}
              </h3>
            </div>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ standard.name }}
          </p>

          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="region in getRegionLabels(standard.applicableRegions)"
              :key="region"
              variant="subtle"
              color="neutral"
              size="xs"
            >
              {{ region }}
            </UBadge>
          </div>

          <div class="text-xs text-gray-500 dark:text-gray-500">
            <p>发布机构: {{ standard.issuer }}</p>
            <p v-if="standard.version">版本: {{ standard.version }}</p>
          </div>

          <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
            <div class="grid grid-cols-2 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold text-primary-600">{{ standard.metricsCount || 0 }}</p>
                <p class="text-xs text-gray-500">披露指标</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-emerald-600">
                  {{ standard.disclosuresCount || 0 }}
                </p>
                <p class="text-xs text-gray-500">披露要求</p>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-400">
              生效日期: {{ standard.effectiveDate || "-" }}
            </span>
            <UButton
              size="xs"
              variant="ghost"
              trailing-icon="i-heroicons-arrow-right"
              @click.stop="navigateTo(`/standards/${standard.code}`)"
            >
              详情
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- 空状态 -->
    <div v-if="!pending && filteredStandards.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-document-magnifying-glass" class="w-12 h-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-500">没有找到匹配的标准</p>
    </div>

    <!-- 说明卡片 -->
    <UCard class="mt-8">
      <template #header>
        <h3 class="font-semibold">支持的主要标准</h3>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div class="space-y-1">
          <p class="font-medium">🌍 全球标准</p>
          <ul class="text-gray-600 dark:text-gray-400 space-y-0.5">
            <li>• GRI 可持续发展报告标准</li>
            <li>• ISSB IFRS S1/S2</li>
            <li>• TCFD 气候披露建议</li>
          </ul>
        </div>
        <div class="space-y-1">
          <p class="font-medium">🇪🇺 欧盟标准</p>
          <ul class="text-gray-600 dark:text-gray-400 space-y-0.5">
            <li>• CSRD/ESRS 企业可持续发展报告指令</li>
            <li>• EU Taxonomy 分类法</li>
          </ul>
        </div>
        <div class="space-y-1">
          <p class="font-medium">🇺🇸 美国标准</p>
          <ul class="text-gray-600 dark:text-gray-400 space-y-0.5">
            <li>• SEC Climate Disclosure</li>
            <li>• SASB 行业标准</li>
          </ul>
        </div>
        <div class="space-y-1">
          <p class="font-medium">🇨🇳 中国标准</p>
          <ul class="text-gray-600 dark:text-gray-400 space-y-0.5">
            <li>• 上交所 ESG 信息披露指引</li>
            <li>• 深交所 ESG 信息披露指引</li>
          </ul>
        </div>
      </div>
    </UCard>
  </div>
</template>
