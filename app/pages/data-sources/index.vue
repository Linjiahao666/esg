<script setup lang="ts">
  definePageMeta({
    layout: "default",
    middleware: ["role"],
    roles: ["admin", "entry"]
  })

  interface DataSource {
    key: string
    name: string
    description: string
    icon: string
    recordCount: number
    lastUpdated?: string
  }

  const toast = useToast()
  const router = useRouter()

  // 数据源列表
  const { data: dataSourcesResponse, pending, refresh } = await useFetch("/api/esg/data-sources")

  const dataSources = computed(() => {
    return (dataSourcesResponse.value as any)?.dataSources || []
  })

  const totalRecords = computed(() => {
    return (dataSourcesResponse.value as any)?.totalRecords || 0
  })

  // 格式化日期
  function formatDate(dateStr?: string) {
    if (!dateStr) return "暂无数据"
    return new Date(dateStr).toLocaleString("zh-CN")
  }

  // 跳转到数据源详情
  function goToDataSource(key: string) {
    router.push(`/data-sources/${key}`)
  }

  // 下载导入模板
  async function downloadTemplate(key: string) {
    try {
      const response = (await $fetch(`/api/esg/records.export.template?dataSource=${key}`, {
        method: "GET",
        responseType: "blob"
      })) as Blob

      const url = window.URL.createObjectURL(response)
      const a = document.createElement("a")
      a.href = url
      a.download = `${key}_template.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.add({
        title: "下载成功",
        description: `已下载 ${key} 导入模板`,
        color: "green"
      })
    } catch (e: any) {
      toast.add({
        title: "下载失败",
        description: e.message || "模板下载失败",
        color: "red"
      })
    }
  }
</script>

<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">数据源管理</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">管理 ESG 指标计算所需的原始数据源</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <UCard>
        <div class="flex items-center">
          <div class="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg mr-4">
            <UIcon
              name="i-heroicons-circle-stack"
              class="w-6 h-6 text-primary-600 dark:text-primary-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">数据源总数</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dataSources.length }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center">
          <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
            <UIcon
              name="i-heroicons-document-text"
              class="w-6 h-6 text-green-600 dark:text-green-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">总记录数</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ totalRecords.toLocaleString() }}
            </p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">操作</p>
            <UButton size="sm" variant="soft" @click="refresh()" :loading="pending">
              刷新数据
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 数据源列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="ds in dataSources"
        :key="ds.key"
        class="cursor-pointer hover:shadow-lg transition-shadow"
        @click="goToDataSource(ds.key)"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
                <UIcon :name="ds.icon" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ ds.name }}</h3>
              </div>
            </div>
            <UBadge :color="ds.recordCount > 0 ? 'green' : 'gray'" variant="subtle">
              {{ ds.recordCount }} 条
            </UBadge>
          </div>
        </template>

        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {{ ds.description }}
        </p>

        <div class="text-xs text-gray-400 dark:text-gray-500 mb-4">
          最后更新: {{ formatDate(ds.lastUpdated) }}
        </div>

        <div class="flex gap-2" @click.stop>
          <UButton
            size="xs"
            variant="soft"
            icon="i-heroicons-arrow-down-tray"
            @click="downloadTemplate(ds.key)"
          >
            下载模板
          </UButton>
          <UButton
            size="xs"
            variant="outline"
            icon="i-heroicons-arrow-up-tray"
            @click="router.push(`/data-sources/${ds.key}?action=import`)"
          >
            导入数据
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- 空状态 -->
    <div v-if="dataSources.length === 0 && !pending" class="text-center py-12">
      <UIcon name="i-heroicons-circle-stack" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-500">暂无数据源</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  </div>
</template>
