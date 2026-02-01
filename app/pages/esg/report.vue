<template>
  <div class="space-y-6 esg-fade-in">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
        >
          <UIcon name="i-heroicons-document-chart-bar" class="text-white text-3xl" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-emerald-800 dark:text-emerald-100">ESG 详细报告</h2>
          <p class="text-emerald-600 dark:text-emerald-400">完整的 ESG 数据指标汇总</p>
        </div>
      </div>
      <UButton to="/" variant="soft" color="primary" class="rounded-xl">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        返回首页
      </UButton>
    </div>

    <!-- Data Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-table-cells" class="text-emerald-500 text-xl" />
            <h3 class="font-semibold text-emerald-800 dark:text-emerald-200">数据指标明细</h3>
          </div>
          <UButton color="neutral" variant="ghost" size="sm">
            <UIcon name="i-heroicons-arrow-down-tray" class="mr-1" />
            导出 CSV
          </UButton>
        </div>
      </template>
      <UTable :rows="esgStore.metrics" />
    </UCard>

    <!-- Footer Info -->
    <div
      class="p-6 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/30 dark:to-cyan-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800"
    >
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-information-circle" class="text-emerald-500 text-xl" />
        <div>
          <p class="text-sm text-emerald-700 dark:text-emerald-300">数据最后更新时间</p>
          <p class="text-xs text-emerald-500 dark:text-emerald-400">
            {{ new Date().toLocaleString("zh-CN") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const esgStore = useEsgStore()

  // 确保进入页面时有数据，如果没有则重新获取
  if (esgStore.metrics.length === 0) {
    await useAsyncData("esg-report", () => esgStore.fetchData())
  }
</script>
