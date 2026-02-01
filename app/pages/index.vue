<template>
  <div class="space-y-8">
    <!-- Hero Section -->
    <div
      class="text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white relative overflow-hidden animate-fade-in-up"
    >
      <!-- Decorative organic shapes -->
      <div
        class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-float"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 animate-float delay-300"
      ></div>

      <div class="relative z-10">
        <div
          class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm mb-6 backdrop-blur-sm hover-scale"
        >
          <UIcon name="i-heroicons-sparkles" class="animate-pulse" />
          <span>可持续发展报告 2026</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold mb-4">ESG 可持续发展管理平台</h1>
        <p class="text-emerald-100 text-lg max-w-2xl mx-auto">
          Environmental, Social, and Governance Data Management
        </p>
      </div>
    </div>

    <!-- ESG 三大支柱概览 -->
    <div class="grid md:grid-cols-3 gap-6">
      <NuxtLink to="/esg/environment" class="group hover-lift animate-fade-in-up delay-100">
        <UCard
          class="h-full border-2 border-transparent hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300"
        >
          <div class="flex flex-col items-center text-center p-4">
            <div
              class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
            >
              <UIcon name="i-heroicons-globe-alt" class="text-white text-3xl" />
            </div>
            <h3 class="font-semibold text-lg text-emerald-800 dark:text-emerald-200 mb-2">
              环境 Environment
            </h3>
            <p class="text-sm text-emerald-600 dark:text-emerald-400 mb-4">
              碳排放、能源消耗、废物管理
            </p>
            <div class="flex items-center gap-2 text-emerald-500">
              <span class="text-2xl font-bold">92</span>
              <UBadge color="success" size="sm">+5%</UBadge>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/esg/social" class="group hover-lift animate-fade-in-up delay-200">
        <UCard
          class="h-full border-2 border-transparent hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-300"
        >
          <div class="flex flex-col items-center text-center p-4">
            <div
              class="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
            >
              <UIcon name="i-heroicons-user-group" class="text-white text-3xl" />
            </div>
            <h3 class="font-semibold text-lg text-teal-800 dark:text-teal-200 mb-2">社会 Social</h3>
            <p class="text-sm text-teal-600 dark:text-teal-400 mb-4">员工福利、多元化、社区贡献</p>
            <div class="flex items-center gap-2 text-teal-500">
              <span class="text-2xl font-bold">88</span>
              <UBadge color="warning" size="sm">+2%</UBadge>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/esg/governance" class="group hover-lift animate-fade-in-up delay-300">
        <UCard
          class="h-full border-2 border-transparent hover:border-green-300 dark:hover:border-green-700 transition-all duration-300"
        >
          <div class="flex flex-col items-center text-center p-4">
            <div
              class="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
            >
              <UIcon name="i-heroicons-building-office" class="text-white text-3xl" />
            </div>
            <h3 class="font-semibold text-lg text-green-800 dark:text-green-200 mb-2">
              治理 Governance
            </h3>
            <p class="text-sm text-green-600 dark:text-green-400 mb-4">
              董事会结构、合规管理、风险控制
            </p>
            <div class="flex items-center gap-2 text-green-500">
              <span class="text-2xl font-bold">95</span>
              <UBadge color="success" size="sm">+8%</UBadge>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- 快速概览 & 待办事项 -->
    <div class="grid md:grid-cols-2 gap-6">
      <UCard class="animate-fade-in-up delay-400">
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-chart-pie"
                class="text-emerald-600 dark:text-emerald-400 text-xl"
              />
            </div>
            <h3 class="text-lg font-semibold text-emerald-800 dark:text-emerald-200">快速概览</h3>
          </div>
        </template>
        <div v-if="esgStore.loading" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl text-emerald-500" />
          <p class="mt-2 text-emerald-600 dark:text-emerald-400">加载中...</p>
        </div>
        <div v-else class="space-y-6">
          <div
            class="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/50 rounded-xl hover-lift"
          >
            <div>
              <span class="text-sm text-emerald-600 dark:text-emerald-400">综合 ESG 评分</span>
              <p class="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {{ esgStore.score }}
              </p>
            </div>
            <div class="text-right">
              <UBadge color="success" size="lg" class="mb-1">优秀</UBadge>
              <p class="text-xs text-emerald-500">满分 100</p>
            </div>
          </div>

          <!-- Progress bar -->
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-emerald-700 dark:text-emerald-300">年度目标完成度</span>
              <span class="font-medium text-emerald-600">78%</span>
            </div>
            <div class="esg-progress">
              <div class="esg-progress-bar" style="width: 78%"></div>
            </div>
          </div>

          <UButton to="/esg/report" block color="primary" size="lg" class="rounded-xl btn-press">
            <UIcon name="i-heroicons-document-chart-bar" class="mr-2" />
            查看详细报告
          </UButton>
        </div>
      </UCard>

      <UCard class="animate-fade-in-up delay-500">
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-clipboard-document-list"
                class="text-amber-600 dark:text-amber-400 text-xl"
              />
            </div>
            <h3 class="text-lg font-semibold text-emerald-800 dark:text-emerald-200">待办事项</h3>
          </div>
        </template>
        <ul class="space-y-3">
          <li
            class="flex gap-3 items-start p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl hover-lift"
          >
            <UIcon
              name="i-heroicons-check-circle-solid"
              class="text-emerald-500 text-xl flex-shrink-0 mt-0.5"
            />
            <div>
              <p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                完成 Q1 碳排放数据录入
              </p>
              <p class="text-xs text-emerald-500">已完成 · 2026-01-15</p>
            </div>
          </li>
          <li
            class="flex gap-3 items-start p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl hover-lift"
          >
            <UIcon
              name="i-heroicons-exclamation-circle-solid"
              class="text-amber-500 text-xl flex-shrink-0 mt-0.5"
            />
            <div>
              <p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                更新员工多元化统计报告
              </p>
              <p class="text-xs text-amber-600">进行中 · 截止 2026-02-28</p>
            </div>
          </li>
          <li
            class="flex gap-3 items-start p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl hover-lift"
          >
            <UIcon name="i-heroicons-clock" class="text-teal-500 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                准备年度 ESG 披露报告
              </p>
              <p class="text-xs text-teal-600">待开始 · 截止 2026-03-31</p>
            </div>
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  const esgStore = useEsgStore()

  // 服务端渲染期间预取数据
  await useAsyncData("esg-home", () => esgStore.fetchData())
</script>
