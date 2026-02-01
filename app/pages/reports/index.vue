<script setup lang="ts">
  definePageMeta({
    middleware: ["auth"]
  })

  const currentPage = ref(1)
  const showCreateDialog = ref(false)
  const selectedTemplate = ref("")
  const newReport = ref({
    title: "",
    periodStart: "",
    periodEnd: ""
  })

  const {
    data: reportsData,
    pending,
    refresh
  } = await useFetch("/api/reports", {
    query: computed(() => ({
      page: currentPage.value,
      pageSize: 10
    }))
  })

  // 从响应中提取数据
  const reports = computed(() => reportsData.value?.data?.items || [])
  const pagination = computed(
    () => reportsData.value?.data?.pagination || { total: 0, totalPages: 1 }
  )

  const { data: templatesData } = await useFetch("/api/reports/templates")
  const templates = computed(() => templatesData.value?.items || [])

  // 报告状态显示配置
  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    draft: { label: "草稿", color: "text-gray-500 bg-gray-100", icon: "i-carbon-document" },
    generating: {
      label: "生成中",
      color: "text-blue-500 bg-blue-100",
      icon: "i-carbon-progress-bar-round"
    },
    review: { label: "待审核", color: "text-amber-500 bg-amber-100", icon: "i-carbon-time" },
    approved: {
      label: "已审核",
      color: "text-green-500 bg-green-100",
      icon: "i-carbon-checkmark-filled"
    },
    published: {
      label: "已发布",
      color: "text-emerald-500 bg-emerald-100",
      icon: "i-carbon-cloud-upload"
    },
    archived: { label: "已归档", color: "text-slate-500 bg-slate-100", icon: "i-carbon-archive" }
  }

  function getStatusConfig(status: string) {
    return statusConfig[status] || statusConfig.draft
  }

  function formatDate(date: string | Date | null) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("zh-CN")
  }

  async function createReport() {
    if (!selectedTemplate.value || !newReport.value.title) {
      return
    }

    try {
      const result = await $fetch("/api/reports", {
        method: "POST",
        body: {
          templateId: selectedTemplate.value,
          title: newReport.value.title,
          periodStart: newReport.value.periodStart,
          periodEnd: newReport.value.periodEnd
        }
      })

      showCreateDialog.value = false
      newReport.value = { title: "", periodStart: "", periodEnd: "" }
      selectedTemplate.value = ""

      // 跳转到编辑页面
      navigateTo(`/reports/${(result as any).data?.id || result.id}/edit`)
    } catch (error: any) {
      alert(error.data?.message || "创建报告失败")
    }
  }

  async function deleteReport(id: number) {
    if (!confirm("确定要删除此报告吗？此操作不可恢复。")) {
      return
    }

    try {
      await $fetch(`/api/reports/${id}`, { method: "DELETE" })
      refresh()
    } catch (error: any) {
      alert(error.data?.message || "删除失败")
    }
  }
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">ESG 报告中心</h1>
        <p class="mt-1 text-sm text-gray-500">管理和生成企业 ESG 可持续发展报告</p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        @click="showCreateDialog = true"
      >
        <span class="i-carbon-add text-lg" />
        创建报告
      </button>
    </div>

    <!-- 报告列表 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200">
      <!-- 加载状态 -->
      <div v-if="pending" class="p-8 text-center">
        <div
          class="i-carbon-progress-bar-round text-3xl text-emerald-500 animate-spin mx-auto mb-2"
        />
        <p class="text-gray-500">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!reports.length" class="p-12 text-center">
        <div class="i-carbon-document text-5xl text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-1">暂无报告</h3>
        <p class="text-gray-500 mb-4">开始创建您的第一份 ESG 报告</p>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          @click="showCreateDialog = true"
        >
          <span class="i-carbon-add" />
          创建报告
        </button>
      </div>

      <!-- 报告表格 -->
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              报告标题
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              报告期间
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              状态
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              进度
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              更新时间
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="report in reports" :key="report.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div>
                <div class="font-medium text-gray-900">{{ report.title }}</div>
                <div class="text-sm text-gray-500">{{ report.template?.name || "-" }}</div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ report.period }}
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusConfig(report.status).color"
              >
                <span :class="getStatusConfig(report.status).icon" />
                {{ getStatusConfig(report.status).label }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-emerald-500 transition-all"
                    :style="{ width: `${report.progress || 0}%` }"
                  />
                </div>
                <span class="text-xs text-gray-500">{{ report.progress || 0 }}%</span>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ formatDate(report.updatedAt) }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink
                  :to="`/reports/${report.id}`"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="查看"
                >
                  <span class="i-carbon-view" />
                </NuxtLink>
                <NuxtLink
                  v-if="report.status === 'draft' || report.status === 'review'"
                  :to="`/reports/${report.id}/edit`"
                  class="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                  title="编辑"
                >
                  <span class="i-carbon-edit" />
                </NuxtLink>
                <button
                  v-if="report.status === 'draft'"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="删除"
                  @click="deleteReport(report.id)"
                >
                  <span class="i-carbon-trash-can" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div
        v-if="pagination.total > 10"
        class="px-6 py-4 border-t border-gray-200 flex items-center justify-between"
      >
        <div class="text-sm text-gray-500">共 {{ pagination.total }} 份报告</div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            上一页
          </button>
          <span class="text-sm text-gray-600">{{ currentPage }} / {{ pagination.totalPages }}</span>
          <button
            class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            :disabled="currentPage >= pagination.totalPages"
            @click="currentPage++"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 创建报告对话框 -->
    <Teleport to="body">
      <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCreateDialog = false" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">创建新报告</h2>

          <form @submit.prevent="createReport">
            <div class="space-y-4">
              <!-- 选择模板 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">报告模板</label>
                <select
                  v-model="selectedTemplate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">请选择模板</option>
                  <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
                    {{ tpl.name }}
                  </option>
                </select>
              </div>

              <!-- 报告标题 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">报告标题</label>
                <input
                  v-model="newReport.title"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="例如：2024年度 ESG 报告"
                  required
                />
              </div>

              <!-- 报告期间 -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input
                    v-model="newReport.periodStart"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input
                    v-model="newReport.periodEnd"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                @click="showCreateDialog = false"
              >
                取消
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                创建
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
