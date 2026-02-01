<template>
  <div class="space-y-6 esg-fade-in">
    <!-- Page Header -->
    <div class="flex items-center gap-4 mb-8">
      <div
        class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
      >
        <UIcon name="i-heroicons-building-office" class="text-white text-3xl" />
      </div>
      <div>
        <h2 class="text-2xl font-bold text-emerald-800 dark:text-emerald-100">公司治理</h2>
        <p class="text-emerald-600 dark:text-emerald-400">
          董事会结构、合规管理、风险控制等治理数据
        </p>
      </div>
    </div>

    <!-- 子模块导航 -->
    <div class="grid md:grid-cols-2 gap-4 mb-8">
      <NuxtLink
        v-for="sm in subModules"
        :key="sm.code"
        :to="`/esg/modules/${sm.code.toLowerCase()}`"
        class="group block"
      >
        <UCard
          class="hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 cursor-pointer"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800/50 dark:to-emerald-800/50 flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <UIcon :name="sm.icon" class="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-emerald-800 dark:text-emerald-100">{{ sm.name }}</h3>
              <p class="text-xs text-green-500">{{ sm.code }}</p>
            </div>
            <UIcon
              name="i-heroicons-chevron-right"
              class="ml-auto text-green-400 group-hover:translate-x-1 transition-transform"
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
            <p class="text-sm text-emerald-600 dark:text-emerald-400 mb-2">合规率</p>
            <p class="text-4xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
            <div
              class="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full"
            >
              <UIcon name="i-heroicons-shield-check" class="text-emerald-500" />
              <span class="text-xs text-emerald-600 dark:text-emerald-400">零违规记录</span>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="overflow-hidden">
        <div class="relative">
          <div
            class="absolute top-0 right-0 w-20 h-20 bg-teal-100 dark:bg-teal-900/50 rounded-full -translate-y-1/2 translate-x-1/2"
          ></div>
          <div class="relative text-center py-2">
            <p class="text-sm text-teal-600 dark:text-teal-400 mb-2">独立董事占比</p>
            <p class="text-4xl font-bold text-teal-600 dark:text-teal-400">60%</p>
            <p class="text-sm text-teal-500 mt-1">6/10 位</p>
            <div class="mt-2 esg-progress mx-auto w-24">
              <div
                class="esg-progress-bar !bg-gradient-to-r !from-teal-400 !to-green-500"
                style="width: 60%"
              ></div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="overflow-hidden">
        <div class="relative">
          <div
            class="absolute top-0 right-0 w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full -translate-y-1/2 translate-x-1/2"
          ></div>
          <div class="relative text-center py-2">
            <p class="text-sm text-green-600 dark:text-green-400 mb-2">审计委员会会议</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">12</p>
            <p class="text-sm text-green-500 mt-1">次/年</p>
            <div class="mt-2 flex justify-center gap-1">
              <span v-for="i in 12" :key="i" class="w-2 h-2 rounded-full bg-green-400"></span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- 董事会构成 -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-user-group" class="text-green-500 text-xl" />
            <h3 class="font-semibold text-emerald-800 dark:text-emerald-200">董事会构成</h3>
          </div>
        </template>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center"
              >
                <UIcon
                  name="i-heroicons-briefcase"
                  class="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <span class="text-emerald-700 dark:text-emerald-300">执行董事</span>
            </div>
            <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">4 位</span>
          </div>
          <div
            class="flex items-center justify-between p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-teal-200 dark:bg-teal-800 flex items-center justify-center"
              >
                <UIcon name="i-heroicons-user" class="text-teal-600 dark:text-teal-400" />
              </div>
              <span class="text-teal-700 dark:text-teal-300">非执行董事</span>
            </div>
            <span class="text-xl font-bold text-teal-600 dark:text-teal-400">2 位</span>
          </div>
          <div
            class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-green-200 dark:bg-green-800 flex items-center justify-center"
              >
                <UIcon name="i-heroicons-academic-cap" class="text-green-600 dark:text-green-400" />
              </div>
              <span class="text-green-700 dark:text-green-300">独立非执行董事</span>
            </div>
            <span class="text-xl font-bold text-green-600 dark:text-green-400">4 位</span>
          </div>
        </div>
      </UCard>

      <!-- 风险管理 -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-shield-check" class="text-emerald-500 text-xl" />
            <h3 class="font-semibold text-emerald-800 dark:text-emerald-200">风险管理</h3>
          </div>
        </template>
        <div class="space-y-4">
          <div class="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <UIcon
              name="i-heroicons-check-circle-solid"
              class="text-emerald-500 text-xl flex-shrink-0 mt-0.5"
            />
            <div>
              <p class="font-medium text-emerald-800 dark:text-emerald-200">全面风险管理框架</p>
              <p class="text-sm text-emerald-600 dark:text-emerald-400">已建立并持续优化</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
            <UIcon
              name="i-heroicons-check-circle-solid"
              class="text-teal-500 text-xl flex-shrink-0 mt-0.5"
            />
            <div>
              <p class="font-medium text-emerald-800 dark:text-emerald-200">定期内部审计</p>
              <p class="text-sm text-teal-600 dark:text-teal-400">每季度进行全面审计</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
            <UIcon
              name="i-heroicons-check-circle-solid"
              class="text-green-500 text-xl flex-shrink-0 mt-0.5"
            />
            <div>
              <p class="font-medium text-emerald-800 dark:text-emerald-200">网络安全保护</p>
              <p class="text-sm text-green-600 dark:text-green-400">ISO 27001 认证</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    title: "公司治理"
  })

  // 治理子模块
  const subModules = [
    { code: "G1", name: "公司治理结构", icon: "i-heroicons-building-office-2" },
    { code: "G2", name: "公司治理机制", icon: "i-heroicons-cog-6-tooth" }
  ]
</script>
