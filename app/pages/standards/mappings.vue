<script setup lang="ts">
  definePageMeta({
    layout: "default"
  })

  const route = useRoute()
  const toast = useToast()

  // URL 参数
  const standardCode = ref((route.query.standardCode as string) || "")
  const subModuleCode = ref((route.query.subModuleCode as string) || "")

  // 获取标准列表
  const { data: standards } = await useFetch("/api/standards")

  // 获取本地子模块列表
  const { data: esgSchema } = await useFetch("/api/esg/schema")

  // 获取现有映射
  const {
    data: existingMappings,
    refresh: refreshMappings,
    pending: loadingMappings
  } = await useFetch("/api/standards/mappings", {
    query: computed(() => ({
      standardCode: standardCode.value || undefined,
      subModuleCode: subModuleCode.value || undefined
    })),
    watch: [standardCode, subModuleCode]
  })

  // 智能推荐状态
  const showSuggestions = ref(false)
  const suggestions = ref<any[]>([])
  const loadingSuggestions = ref(false)

  // 获取智能推荐
  async function getSuggestions() {
    if (!standardCode.value) {
      toast.add({ title: "请先选择标准", color: "warning" })
      return
    }

    loadingSuggestions.value = true
    try {
      const result = await $fetch("/api/standards/mappings/suggest", {
        method: "POST",
        body: {
          standardCode: standardCode.value,
          subModuleCode: subModuleCode.value || undefined,
          threshold: 50
        }
      })
      suggestions.value = (result as any).suggestions || []
      showSuggestions.value = true
    } catch (error: any) {
      toast.add({ title: "获取推荐失败", description: error.message, color: "error" })
    } finally {
      loadingSuggestions.value = false
    }
  }

  // 应用推荐映射
  async function applyMapping(suggestion: any) {
    try {
      await $fetch("/api/standards/mappings", {
        method: "POST",
        body: {
          localMetricId: suggestion.localMetricId,
          standardMetricId: suggestion.standardMetricId,
          mappingType: suggestion.mappingType,
          confidence: suggestion.confidence,
          isAutoMapped: true
        }
      })
      toast.add({ title: "映射创建成功", color: "success" })

      // 从推荐列表中移除
      suggestions.value = suggestions.value.filter(
        (s) =>
          s.localMetricId !== suggestion.localMetricId ||
          s.standardMetricId !== suggestion.standardMetricId
      )

      // 刷新映射列表
      refreshMappings()
    } catch (error: any) {
      toast.add({ title: "创建映射失败", description: error.message, color: "error" })
    }
  }

  // 批量应用推荐
  async function applyAllSuggestions() {
    const highConfidence = suggestions.value.filter((s) => s.confidence >= 80)

    for (const suggestion of highConfidence) {
      await applyMapping(suggestion)
    }

    toast.add({
      title: `已应用 ${highConfidence.length} 个高置信度映射`,
      color: "success"
    })
  }

  // 标准选项
  const standardOptions = computed(() => {
    if (!standards.value) return []
    return standards.value.map((s: any) => ({
      label: `${s.code} - ${s.name}`,
      value: s.code
    }))
  })

  // 子模块选项
  const subModuleOptions = computed(() => {
    if (!esgSchema.value) return [{ label: "全部模块", value: "" }]

    const options = [{ label: "全部模块", value: "" }]

    for (const module of (esgSchema.value as any).modules || []) {
      for (const subModule of module.subModules || []) {
        options.push({
          label: `${subModule.code} - ${subModule.name}`,
          value: subModule.code
        })
      }
    }

    return options
  })

  // 获取映射类型标签
  function getMappingTypeLabel(type: string) {
    const labels: Record<string, string> = {
      exact: "完全匹配",
      partial: "部分匹配",
      aggregated: "聚合映射",
      derived: "派生映射",
      proxy: "代理映射"
    }
    return labels[type] || type
  }

  function getMappingTypeColor(type: string) {
    const colors: Record<string, string> = {
      exact: "success",
      partial: "warning",
      aggregated: "info",
      derived: "primary",
      proxy: "neutral"
    }
    return colors[type] || "neutral"
  }

  // 置信度颜色
  function getConfidenceColor(confidence: number) {
    if (confidence >= 80) return "success"
    if (confidence >= 60) return "warning"
    return "error"
  }
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- 面包屑 -->
    <UBreadcrumb
      :links="[{ label: '标准管理', to: '/standards' }, { label: '指标映射' }]"
      class="mb-6"
    />

    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">指标映射配置</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        建立本地 ESG 指标与国际标准指标的映射关系，支持智能推荐匹配
      </p>
    </div>

    <!-- 筛选栏 -->
    <UCard class="mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="选择标准" class="flex-1 min-w-[200px]">
          <USelectMenu
            v-model="standardCode"
            :options="standardOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="请选择标准"
            searchable
          />
        </UFormGroup>

        <UFormGroup label="本地模块" class="flex-1 min-w-[200px]">
          <USelectMenu
            v-model="subModuleCode"
            :options="subModuleOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="全部模块"
          />
        </UFormGroup>

        <UButton
          :loading="loadingSuggestions"
          :disabled="!standardCode"
          icon="i-heroicons-sparkles"
          @click="getSuggestions"
        >
          智能推荐
        </UButton>
      </div>
    </UCard>

    <!-- 智能推荐结果 -->
    <UCard v-if="showSuggestions && suggestions.length > 0" class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-sparkles" class="text-amber-500" />
            <h3 class="font-semibold">智能推荐映射</h3>
            <UBadge>{{ suggestions.length }} 条建议</UBadge>
          </div>
          <div class="flex gap-2">
            <UButton size="sm" variant="soft" @click="applyAllSuggestions">
              应用高置信度 (≥80%)
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showSuggestions = false"
            />
          </div>
        </div>
      </template>

      <UTable
        :rows="suggestions"
        :columns="[
          { key: 'localMetricCode', label: '本地指标' },
          { key: 'standardMetricCode', label: '标准指标' },
          { key: 'confidence', label: '置信度' },
          { key: 'mappingType', label: '映射类型' },
          { key: 'matchReason', label: '匹配原因' },
          { key: 'actions', label: '操作' }
        ]"
      >
        <template #localMetricCode-data="{ row }">
          <div>
            <p class="font-mono text-sm">{{ row.localMetricCode }}</p>
            <p class="text-xs text-gray-500">{{ row.localMetricName }}</p>
          </div>
        </template>

        <template #standardMetricCode-data="{ row }">
          <div>
            <p class="font-mono text-sm">{{ row.standardMetricCode }}</p>
            <p class="text-xs text-gray-500">{{ row.standardMetricName }}</p>
          </div>
        </template>

        <template #confidence-data="{ row }">
          <UBadge :color="getConfidenceColor(row.confidence)"> {{ row.confidence }}% </UBadge>
        </template>

        <template #mappingType-data="{ row }">
          <UBadge :color="getMappingTypeColor(row.mappingType)" variant="subtle">
            {{ getMappingTypeLabel(row.mappingType) }}
          </UBadge>
        </template>

        <template #matchReason-data="{ row }">
          <span class="text-xs text-gray-600">{{ row.matchReason }}</span>
        </template>

        <template #actions-data="{ row }">
          <UButton size="xs" icon="i-heroicons-check" @click="applyMapping(row)"> 应用 </UButton>
        </template>
      </UTable>
    </UCard>

    <!-- 现有映射列表 -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">已配置的映射关系</h3>
          <UButton
            size="sm"
            variant="ghost"
            icon="i-heroicons-arrow-path"
            :loading="loadingMappings"
            @click="refreshMappings()"
          >
            刷新
          </UButton>
        </div>
      </template>

      <div v-if="loadingMappings" class="space-y-2">
        <USkeleton v-for="i in 5" :key="i" class="h-16" />
      </div>

      <UTable
        v-else-if="existingMappings?.length"
        :rows="existingMappings"
        :columns="[
          { key: 'localMetric', label: '本地指标' },
          { key: 'standardMetric', label: '标准指标' },
          { key: 'standard', label: '标准' },
          { key: 'mappingType', label: '映射类型' },
          { key: 'confidence', label: '置信度' },
          { key: 'isVerified', label: '状态' }
        ]"
      >
        <template #localMetric-data="{ row }">
          <div>
            <p class="font-mono text-sm">{{ row.localMetric.code }}</p>
            <p class="text-xs text-gray-500">{{ row.localMetric.name }}</p>
          </div>
        </template>

        <template #standardMetric-data="{ row }">
          <div>
            <p class="font-mono text-sm">{{ row.standardMetric.code }}</p>
            <p class="text-xs text-gray-500">{{ row.standardMetric.name }}</p>
          </div>
        </template>

        <template #standard-data="{ row }">
          <UBadge variant="subtle">{{ row.standard.code }}</UBadge>
        </template>

        <template #mappingType-data="{ row }">
          <UBadge :color="getMappingTypeColor(row.mappingType)" variant="subtle">
            {{ getMappingTypeLabel(row.mappingType) }}
          </UBadge>
        </template>

        <template #confidence-data="{ row }">
          <UBadge :color="getConfidenceColor(row.confidence)"> {{ row.confidence }}% </UBadge>
        </template>

        <template #isVerified-data="{ row }">
          <UBadge :color="row.isVerified ? 'success' : 'neutral'" variant="subtle">
            {{ row.isVerified ? "已验证" : "待验证" }}
          </UBadge>
        </template>
      </UTable>

      <div v-else class="text-center py-12">
        <UIcon name="i-heroicons-arrows-right-left" class="w-12 h-12 mx-auto text-gray-400" />
        <p class="mt-4 text-gray-500">暂无映射配置</p>
        <p class="text-sm text-gray-400">请选择标准后使用智能推荐功能</p>
      </div>
    </UCard>
  </div>
</template>
