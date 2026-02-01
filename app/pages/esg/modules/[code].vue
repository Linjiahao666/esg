<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 面包屑导航 -->
    <nav class="mb-6 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
      <NuxtLink to="/" class="hover:text-emerald-700 dark:hover:text-emerald-300"> 首页 </NuxtLink>
      <UIcon name="i-heroicons-chevron-right" />
      <button
        @click="() => router.push(`/esg/${moduleInfo.route}`)"
        class="hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer bg-transparent border-none p-0"
      >
        {{ moduleInfo.name }}
      </button>
      <UIcon name="i-heroicons-chevron-right" />
      <span class="text-emerald-800 dark:text-emerald-200">{{ subModuleName }}</span>
    </nav>

    <!-- 标签页切换 -->
    <UTabs v-model="activeTab" :items="tabs" class="mb-6">
      <template #default="{ item, selected }">
        <div class="flex items-center gap-2">
          <UIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </div>
      </template>
    </UTabs>

    <!-- 内容区域 -->
    <div v-if="activeTab === 'dashboard'">
      <EsgSubModuleDashboard
        :sub-module-code="subModuleCode"
        @add="activeTab = 'form'"
        @edit="handleEdit"
      />
    </div>

    <div v-else-if="activeTab === 'form'">
      <EsgSubModuleForm
        :sub-module-code="subModuleCode"
        @saved="handleSaved"
        @submitted="handleSubmitted"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  // 获取子模块代码
  const subModuleCode = computed(() => (route.params.code as string)?.toUpperCase() || "")

  // 模块信息映射
  const moduleMap: Record<string, { name: string; route: string }> = {
    E: { name: "环境", route: "environment" },
    S: { name: "社会", route: "social" },
    G: { name: "治理", route: "governance" }
  }

  const moduleInfo = computed(() => {
    const moduleCode = subModuleCode.value.charAt(0)
    return moduleMap[moduleCode] || { name: "ESG", route: "report" }
  })

  // 子模块名称映射
  const subModuleNames: Record<string, string> = {
    E1: "碳排放",
    E2: "污染物排放",
    E3: "资源消耗",
    E4: "环境管理",
    S1: "员工",
    S2: "供应链管理",
    S3: "社会责任",
    G1: "公司治理结构",
    G2: "公司治理机制"
  }

  const subModuleName = computed(() => subModuleNames[subModuleCode.value] || subModuleCode.value)

  // 标签页
  const tabs = [
    { value: "dashboard", label: "数据总览", icon: "i-heroicons-chart-bar" },
    { value: "form", label: "数据录入", icon: "i-heroicons-pencil-square" }
  ]
  const activeTab = ref("dashboard")

  // 事件处理
  const handleEdit = (record: any) => {
    activeTab.value = "form"
  }

  const handleSaved = () => {
    toast.add({
      title: "保存成功",
      description: "草稿已保存",
      color: "success"
    })
  }

  const handleSubmitted = () => {
    toast.add({
      title: "提交成功",
      description: "数据已提交审核",
      color: "success"
    })
    activeTab.value = "dashboard"
  }

  // 页面元数据
  useHead({
    title: () => `${subModuleName.value} - ESG Dashboard`
  })
</script>
