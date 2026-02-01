<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-slate-950 p-6"
  >
    <div class="text-center max-w-md">
      <!-- 错误图标 -->
      <div
        class="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
      >
        <UIcon
          :name="error?.statusCode === 404 ? 'i-heroicons-map' : 'i-heroicons-exclamation-triangle'"
          class="text-white text-6xl"
        />
      </div>

      <!-- 错误代码 -->
      <h1 class="text-8xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
        {{ error?.statusCode || 500 }}
      </h1>

      <!-- 错误标题 -->
      <h2 class="text-2xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
        {{ errorTitle }}
      </h2>

      <!-- 错误描述 -->
      <p class="text-emerald-600 dark:text-emerald-400 mb-8">
        {{ errorMessage }}
      </p>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton
          size="lg"
          color="primary"
          class="rounded-xl"
          icon="i-heroicons-home"
          @click="handleError"
        >
          返回首页
        </UButton>
        <UButton
          size="lg"
          color="neutral"
          variant="outline"
          class="rounded-xl"
          icon="i-heroicons-arrow-left"
          @click="goBack"
        >
          返回上页
        </UButton>
      </div>

      <!-- 装饰元素 -->
      <div class="mt-12 flex justify-center gap-2">
        <span
          v-for="i in 3"
          :key="i"
          class="w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-700"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { NuxtError } from "#app"

  const props = defineProps<{
    error: NuxtError
  }>()

  const errorTitle = computed(() => {
    switch (props.error?.statusCode) {
      case 404:
        return "页面未找到"
      case 403:
        return "访问被拒绝"
      case 500:
        return "服务器错误"
      default:
        return "出错了"
    }
  })

  const errorMessage = computed(() => {
    switch (props.error?.statusCode) {
      case 404:
        return "抱歉，您访问的页面不存在或已被移除。"
      case 403:
        return "抱歉，您没有权限访问此页面。"
      case 500:
        return "服务器遇到了问题，请稍后再试。"
      default:
        return props.error?.message || "发生了一个未知错误。"
    }
  })

  const handleError = () => {
    clearError({ redirect: "/" })
  }

  const goBack = () => {
    const router = useRouter()
    router.back()
  }
</script>
