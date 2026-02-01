<template>
  <div class="space-y-6 esg-fade-in">
    <!-- Page Header -->
    <div class="flex items-center gap-4 mb-8">
      <div
        class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
      >
        <UIcon name="i-heroicons-globe-alt" class="text-white text-3xl" />
      </div>
      <div>
        <h2 class="text-2xl font-bold text-emerald-800 dark:text-emerald-100">环境指标</h2>
        <p class="text-emerald-600 dark:text-emerald-400">
          碳排放、能源消耗、废物管理等环境相关数据
        </p>
      </div>
    </div>

    <!-- 子模块导航 -->
    <div class="grid md:grid-cols-4 gap-4 mb-8">
      <NuxtLink
        v-for="sm in subModules"
        :key="sm.code"
        :to="`/esg/modules/${sm.code.toLowerCase()}`"
        class="group block"
      >
        <UCard
          class="hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-800/50 dark:to-teal-800/50 flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <UIcon :name="sm.icon" class="text-emerald-600 dark:text-emerald-400 text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-emerald-800 dark:text-emerald-100">{{ sm.name }}</h3>
              <p class="text-xs text-emerald-500">{{ sm.code }}</p>
            </div>
            <UIcon
              name="i-heroicons-chevron-right"
              class="ml-auto text-emerald-400 group-hover:translate-x-1 transition-transform"
            />
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Stats Cards -->
    <div class="grid md:grid-cols-3 gap-6">
      <UCard class="overflow-hidden">
        <div class="relative">
          <div
            class="absolute top-0 right-0 w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full -translate-y-1/2 translate-x-1/2"
          ></div>
          <div class="relative text-center py-2">
            <p class="text-sm text-emerald-600 dark:text-emerald-400 mb-2">碳排放总量</p>
            <p class="text-4xl font-bold text-emerald-700 dark:text-emerald-300">450</p>
            <p class="text-sm text-emerald-500 mt-1">tCO₂e</p>
            <div class="mt-3 flex items-center justify-center gap-2">
              <UIcon name="i-heroicons-arrow-trending-down" class="text-emerald-500" />
              <span class="text-sm text-emerald-600">较去年减少 12%</span>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="overflow-hidden">
        <div class="relative">
          <div
            class="absolute top-0 right-0 w-20 h-20 bg-cyan-100 dark:bg-cyan-900/50 rounded-full -translate-y-1/2 translate-x-1/2"
          ></div>
          <div class="relative text-center py-2">
            <p class="text-sm text-cyan-600 dark:text-cyan-400 mb-2">可再生能源占比</p>
            <p class="text-4xl font-bold text-cyan-600 dark:text-cyan-400">68%</p>
            <p class="text-sm text-cyan-500 mt-1">清洁能源使用率</p>
            <div class="mt-3 flex items-center justify-center gap-2">
              <UIcon name="i-heroicons-arrow-trending-up" class="text-cyan-500" />
              <span class="text-sm text-cyan-600">同比 +12%</span>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="overflow-hidden">
        <div class="relative">
          <div
            class="absolute top-0 right-0 w-20 h-20 bg-amber-100 dark:bg-amber-900/50 rounded-full -translate-y-1/2 translate-x-1/2"
          ></div>
          <div class="relative text-center py-2">
            <p class="text-sm text-amber-600 dark:text-amber-400 mb-2">废物回收率</p>
            <p class="text-4xl font-bold text-amber-600 dark:text-amber-400">85%</p>
            <p class="text-sm text-amber-500 mt-1">目标 90%</p>
            <div class="mt-3">
              <div class="esg-progress mx-auto w-32">
                <div
                  class="esg-progress-bar !bg-gradient-to-r !from-amber-400 !to-amber-500"
                  style="width: 85%"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Chart Section -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-chart-bar" class="text-emerald-500 text-xl" />
            <h3 class="font-semibold text-emerald-800 dark:text-emerald-200">月度碳排放趋势</h3>
          </div>
          <UButton color="neutral" variant="ghost" size="sm">
            <UIcon name="i-heroicons-arrow-down-tray" class="mr-1" />
            导出
          </UButton>
        </div>
      </template>
      <div
        class="h-64 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/30 dark:to-cyan-900/30 border-2 border-dashed border-emerald-200 dark:border-emerald-700"
      >
        <div class="text-center">
          <UIcon
            name="i-heroicons-chart-bar"
            class="text-5xl text-emerald-300 dark:text-emerald-600 mb-3"
          />
          <p class="text-emerald-500 dark:text-emerald-400">图表占位区域</p>
          <p class="text-sm text-emerald-400 dark:text-emerald-500">
            可集成 ECharts、Chart.js 或 ApexCharts
          </p>
        </div>
      </div>
    </UCard>

    <!-- Environmental Initiatives -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-leaf" class="text-emerald-500 text-xl" />
          <h3 class="font-semibold text-emerald-800 dark:text-emerald-200">环保举措</h3>
        </div>
      </template>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
          <UIcon name="i-heroicons-sun" class="text-amber-500 text-2xl flex-shrink-0" />
          <div>
            <h4 class="font-medium text-emerald-800 dark:text-emerald-200">太阳能发电项目</h4>
            <p class="text-sm text-emerald-600 dark:text-emerald-400">已安装 2MW 光伏发电系统</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl">
          <UIcon name="i-heroicons-beaker" class="text-cyan-500 text-2xl flex-shrink-0" />
          <div>
            <h4 class="font-medium text-emerald-800 dark:text-emerald-200">水资源循环利用</h4>
            <p class="text-sm text-emerald-600 dark:text-emerald-400">工业用水回收率达 75%</p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    title: "环境指标"
  })

  // 环境子模块
  const subModules = [
    { code: "E1", name: "碳排放", icon: "i-heroicons-fire" },
    { code: "E2", name: "污染物排放", icon: "i-heroicons-cloud" },
    { code: "E3", name: "资源消耗", icon: "i-heroicons-bolt" },
    { code: "E4", name: "环境管理", icon: "i-heroicons-cog-6-tooth" }
  ]
</script>
