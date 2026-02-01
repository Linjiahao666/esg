<template>
  <div class="space-y-6 esg-fade-in">
    <!-- Page Header -->
    <div class="flex items-center gap-4 mb-8">
      <div
        class="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center shadow-lg shadow-teal-500/30"
      >
        <UIcon name="i-heroicons-user-group" class="text-white text-3xl" />
      </div>
      <div>
        <h2 class="text-2xl font-bold text-emerald-800 dark:text-emerald-100">社会责任</h2>
        <p class="text-emerald-600 dark:text-emerald-400">
          员工福利、多元化、社区贡献等社会责任数据
        </p>
      </div>
    </div>

    <!-- 子模块导航 -->
    <div class="grid md:grid-cols-3 gap-4 mb-8">
      <NuxtLink
        v-for="sm in subModules"
        :key="sm.code"
        :to="`/esg/modules/${sm.code.toLowerCase()}`"
        class="group block"
      >
        <UCard
          class="hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 cursor-pointer"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-green-100 dark:from-teal-800/50 dark:to-green-800/50 flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <UIcon :name="sm.icon" class="text-teal-600 dark:text-teal-400 text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-emerald-800 dark:text-emerald-100">{{ sm.name }}</h3>
              <p class="text-xs text-teal-500">{{ sm.code }}</p>
            </div>
            <UIcon
              name="i-heroicons-chevron-right"
              class="ml-auto text-teal-400 group-hover:translate-x-1 transition-transform"
            />
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- 员工满意度 -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-face-smile" class="text-teal-500 text-xl" />
            <h3 class="font-semibold text-emerald-800 dark:text-emerald-200">员工满意度</h3>
          </div>
        </template>
        <div class="space-y-4">
          <div class="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-teal-700 dark:text-teal-300">整体满意度</span>
              <span class="text-xl font-bold text-teal-600">92%</span>
            </div>
            <div class="esg-progress">
              <div
                class="esg-progress-bar !bg-gradient-to-r !from-teal-400 !to-green-500"
                style="width: 92%"
              ></div>
            </div>
          </div>
          <div
            class="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl"
          >
            <span class="text-sm text-emerald-700 dark:text-emerald-300">工作环境</span>
            <UBadge color="success">89%</UBadge>
          </div>
          <div
            class="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl"
          >
            <span class="text-sm text-amber-700 dark:text-amber-300">职业发展</span>
            <UBadge color="warning">78%</UBadge>
          </div>
        </div>
      </UCard>

      <!-- 多元化指标 -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-users" class="text-teal-500 text-xl" />
            <h3 class="font-semibold text-emerald-800 dark:text-emerald-200">多元化指标</h3>
          </div>
        </template>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-teal-200 dark:bg-teal-800 flex items-center justify-center"
              >
                <UIcon name="i-heroicons-user" class="text-teal-600 dark:text-teal-400" />
              </div>
              <span class="text-sm text-teal-700 dark:text-teal-300">女性员工占比</span>
            </div>
            <span class="text-xl font-bold text-teal-600 dark:text-teal-400">45%</span>
          </div>
          <div
            class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center"
              >
                <UIcon name="i-heroicons-briefcase" class="text-green-600 dark:text-green-400" />
              </div>
              <span class="text-sm text-green-700 dark:text-green-300">管理层女性占比</span>
            </div>
            <span class="text-xl font-bold text-green-600 dark:text-green-400">38%</span>
          </div>
          <div
            class="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center"
              >
                <UIcon
                  name="i-heroicons-globe-americas"
                  class="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <span class="text-sm text-emerald-700 dark:text-emerald-300">少数族裔占比</span>
            </div>
            <span class="text-xl font-bold text-emerald-600 dark:text-emerald-400">22%</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 社区贡献 -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-heart" class="text-emerald-500 text-xl" />
          <h3 class="font-semibold text-emerald-800 dark:text-emerald-200">社区贡献</h3>
        </div>
      </template>
      <div class="grid md:grid-cols-3 gap-6">
        <div
          class="text-center p-6 bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/30 dark:to-green-900/30 rounded-2xl"
        >
          <div
            class="w-14 h-14 mx-auto rounded-2xl bg-teal-100 dark:bg-teal-800 flex items-center justify-center mb-4"
          >
            <UIcon name="i-heroicons-banknotes" class="text-teal-600 dark:text-teal-400 text-2xl" />
          </div>
          <p class="text-3xl font-bold text-teal-600 dark:text-teal-400">¥2.5M</p>
          <p class="text-sm text-teal-500 dark:text-teal-400 mt-1">公益捐赠</p>
        </div>
        <div
          class="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl"
        >
          <div
            class="w-14 h-14 mx-auto rounded-2xl bg-green-100 dark:bg-green-800 flex items-center justify-center mb-4"
          >
            <UIcon name="i-heroicons-clock" class="text-green-600 dark:text-green-400 text-2xl" />
          </div>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">1,200</p>
          <p class="text-sm text-green-500 dark:text-green-400 mt-1">志愿者小时</p>
        </div>
        <div
          class="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl"
        >
          <div
            class="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center mb-4"
          >
            <UIcon
              name="i-heroicons-hand-raised"
              class="text-emerald-600 dark:text-emerald-400 text-2xl"
            />
          </div>
          <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">15</p>
          <p class="text-sm text-emerald-500 dark:text-emerald-400 mt-1">合作公益项目</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    title: "社会责任"
  })

  // 社会子模块
  const subModules = [
    { code: "S1", name: "员工", icon: "i-heroicons-users" },
    { code: "S2", name: "供应链管理", icon: "i-heroicons-truck" },
    { code: "S3", name: "社会责任", icon: "i-heroicons-heart" }
  ]
</script>
