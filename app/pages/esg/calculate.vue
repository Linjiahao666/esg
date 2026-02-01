<script setup lang="ts">
  definePageMeta({
    layout: "default",
    middleware: ["role"],
    roles: ["admin", "auditor"]
  })

  const toast = useToast()

  // 周期选择
  const currentYear = new Date().getFullYear()
  const periodOptions = [
    { label: `${currentYear} 年度`, value: String(currentYear) },
    { label: `${currentYear - 1} 年度`, value: String(currentYear - 1) },
    { label: `${currentYear} Q1`, value: `${currentYear}-Q1` },
    { label: `${currentYear} Q2`, value: `${currentYear}-Q2` },
    { label: `${currentYear} Q3`, value: `${currentYear}-Q3` },
    { label: `${currentYear} Q4`, value: `${currentYear}-Q4` }
  ]

  const selectedPeriod = ref(String(currentYear))
  const saveResults = ref(true)
  const calculating = ref(false)
  const calculationResults = ref<any>(null)

  // 数据源统计
  const { data: dataSourcesResponse, pending: loadingDataSources } =
    await useFetch("/api/esg/data-sources")

  const dataSources = computed(() => {
    return (dataSourcesResponse.value as any)?.dataSources || []
  })

  const hasEnoughData = computed(() => {
    return dataSources.value.some((ds: any) => ds.recordCount > 0)
  })

  // 执行计算
  async function runCalculation() {
    calculating.value = true
    calculationResults.value = null

    try {
      const response = (await $fetch("/api/esg/calculate", {
        method: "POST",
        body: {
          period: selectedPeriod.value,
          saveResults: saveResults.value
        }
      })) as any

      if (response.success) {
        calculationResults.value = response
        toast.add({
          title: "计算完成",
          description: `成功计算 ${response.successful} 个指标`,
          color: "green"
        })
      } else {
        toast.add({
          title: "计算失败",
          description: response.message,
          color: "red"
        })
      }
    } catch (e: any) {
      toast.add({
        title: "计算失败",
        description: e.message,
        color: "red"
      })
    } finally {
      calculating.value = false
    }
  }

  // 格式化计算结果
  function formatResult(result: any) {
    if (!result.success) return { display: "计算失败", color: "red" }

    const value = result.value
    if (typeof value === "number") {
      if (result.unit === "%") {
        return { display: `${value.toFixed(2)}%`, color: "green" }
      }
      return {
        display: value.toLocaleString("zh-CN", { maximumFractionDigits: 2 }),
        color: "green"
      }
    }
    return { display: String(value), color: "green" }
  }
</script>

<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">ESG 指标计算</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        根据导入的原始数据自动计算 ESG 指标值
      </p>
    </div>

    <!-- 数据源状态 -->
    <UCard class="mb-6">
      <template #header>
        <h3 class="font-semibold">数据源状态</h3>
      </template>

      <div v-if="loadingDataSources" class="flex justify-center py-4">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div
          v-for="ds in dataSources"
          :key="ds.key"
          class="p-3 rounded-lg border"
          :class="
            ds.recordCount > 0
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
          "
        >
          <div class="flex items-center mb-1">
            <UIcon
              :name="ds.icon"
              class="w-4 h-4 mr-2"
              :class="ds.recordCount > 0 ? 'text-green-600' : 'text-gray-400'"
            />
            <span class="text-sm font-medium">{{ ds.name }}</span>
          </div>
          <p
            class="text-lg font-bold"
            :class="ds.recordCount > 0 ? 'text-green-600' : 'text-gray-400'"
          >
            {{ ds.recordCount }}
          </p>
        </div>
      </div>

      <div v-if="!hasEnoughData" class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div class="flex items-start">
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
          />
          <div>
            <p class="text-sm text-yellow-800 dark:text-yellow-200 font-medium">数据不足</p>
            <p class="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
              请先导入原始数据，才能计算 ESG 指标
            </p>
            <NuxtLink to="/data-sources">
              <UButton class="mt-2" size="xs" variant="soft" color="yellow">
                前往数据源管理
              </UButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </UCard>

    <!-- 计算设置 -->
    <UCard class="mb-6">
      <template #header>
        <h3 class="font-semibold">计算设置</h3>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormGroup label="计算周期">
          <USelectMenu
            v-model="selectedPeriod"
            :options="periodOptions"
            value-attribute="value"
            option-attribute="label"
          />
        </UFormGroup>

        <UFormGroup label="保存结果">
          <UCheckbox v-model="saveResults" label="将计算结果保存到 ESG 记录" />
        </UFormGroup>

        <div class="flex items-end">
          <UButton
            color="primary"
            size="lg"
            icon="i-heroicons-calculator"
            :loading="calculating"
            :disabled="!hasEnoughData"
            @click="runCalculation"
          >
            开始计算
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- 计算结果 -->
    <UCard v-if="calculationResults">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">计算结果</h3>
          <div class="flex gap-2">
            <UBadge color="green" variant="subtle">
              成功: {{ calculationResults.successful }}
            </UBadge>
            <UBadge v-if="calculationResults.failed > 0" color="red" variant="subtle">
              失败: {{ calculationResults.failed }}
            </UBadge>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- 成功的计算结果 -->
        <div
          v-for="(result, code) in calculationResults.results"
          :key="code"
          class="p-4 rounded-lg border"
          :class="
            result.success
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
          "
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ code }}</p>
              <p v-if="result.details" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ JSON.stringify(result.details) }}
              </p>
              <p v-if="result.error" class="text-sm text-red-500 mt-1">
                {{ result.error }}
              </p>
            </div>
            <div class="text-right">
              <p
                class="text-2xl font-bold"
                :class="result.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ formatResult(result).display }}
              </p>
              <p v-if="result.unit" class="text-sm text-gray-500">{{ result.unit }}</p>
            </div>
          </div>
        </div>

        <!-- 空结果提示 -->
        <div v-if="Object.keys(calculationResults.results).length === 0" class="text-center py-8">
          <UIcon name="i-heroicons-calculator" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500">暂无可计算的指标</p>
          <p class="text-sm text-gray-400 mt-2">请先配置指标计算公式</p>
        </div>
      </div>

      <!-- 错误列表 -->
      <div
        v-if="calculationResults.errors && calculationResults.errors.length > 0"
        class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
      >
        <p class="font-medium text-red-800 dark:text-red-200 mb-2">计算错误</p>
        <ul class="text-sm text-red-600 dark:text-red-300 space-y-1">
          <li v-for="(error, i) in calculationResults.errors" :key="i">
            {{ error }}
          </li>
        </ul>
      </div>
    </UCard>

    <!-- 使用说明 -->
    <UCard class="mt-6">
      <template #header>
        <h3 class="font-semibold">使用说明</h3>
      </template>

      <div class="prose prose-sm dark:prose-invert max-w-none">
        <ol>
          <li>
            <strong>导入原始数据</strong
            >：前往「数据源管理」页面，导入员工、能源消耗、供应商等原始数据
          </li>
          <li><strong>选择计算周期</strong>：选择需要计算的报告周期（年度或季度）</li>
          <li>
            <strong>执行计算</strong>：点击「开始计算」，系统将根据预设公式自动计算各 ESG 指标
          </li>
          <li><strong>查看结果</strong>：计算完成后可查看各指标的计算结果和详情</li>
          <li><strong>保存记录</strong>：勾选「保存结果」可将计算值自动保存到 ESG 记录中</li>
        </ol>

        <h4>支持的计算类型</h4>
        <ul>
          <li><strong>员工指标</strong>：总人数、性别比例、党员比例、学历分布等</li>
          <li><strong>能源指标</strong>：能耗总量、可再生能源比例、能源成本等</li>
          <li><strong>碳排放指标</strong>：范围1/2/3排放量、碳强度等</li>
          <li><strong>废物指标</strong>：废物总量、回收率、危废处理量等</li>
          <li><strong>供应商指标</strong>：供应商数量、本地化率、ESG评级分布等</li>
          <li><strong>培训指标</strong>：人均培训时长、培训覆盖率等</li>
          <li><strong>安全指标</strong>：工伤事故数、损失工时、事故率等</li>
          <li><strong>公益指标</strong>：捐赠金额、志愿服务时长等</li>
        </ul>
      </div>
    </UCard>
  </div>
</template>
