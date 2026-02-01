<script setup lang="ts">
  definePageMeta({
    middleware: ["auth"]
  })

  const route = useRoute()
  const reportId = computed(() => route.params.id as string)

  // 获取报告详情
  const { data: report, pending, refresh } = await useFetch(`/api/reports/${reportId.value}`)

  // 状态配置
  const statusConfig: Record<
    string,
    { label: string; color: string; icon: string; actions: string[] }
  > = {
    draft: {
      label: "草稿",
      color: "bg-gray-100 text-gray-700",
      icon: "i-carbon-document",
      actions: ["edit", "delete"]
    },
    generating: {
      label: "生成中",
      color: "bg-blue-100 text-blue-700",
      icon: "i-carbon-progress-bar-round",
      actions: []
    },
    review: {
      label: "待审核",
      color: "bg-amber-100 text-amber-700",
      icon: "i-carbon-time",
      actions: ["edit", "approve", "reject"]
    },
    approved: {
      label: "已审核",
      color: "bg-green-100 text-green-700",
      icon: "i-carbon-checkmark-filled",
      actions: ["publish", "export"]
    },
    published: {
      label: "已发布",
      color: "bg-emerald-100 text-emerald-700",
      icon: "i-carbon-cloud-upload",
      actions: ["export", "archive"]
    },
    archived: {
      label: "已归档",
      color: "bg-slate-100 text-slate-700",
      icon: "i-carbon-archive",
      actions: []
    }
  }

  const currentStatus = computed(() => statusConfig[report.value?.status || "draft"])

  // 用户权限
  const { user } = useAuth()
  const isAdmin = computed(() => user.value?.role === "admin")

  // 解析章节
  const sections = computed(() => {
    if (!report.value?.template?.config) return []
    try {
      const config = JSON.parse(report.value.template.config)
      return config.sections || []
    } catch {
      return []
    }
  })

  // 获取章节内容
  function getSectionContent(code: string) {
    const section = report.value?.sections?.find((s: any) => s.sectionCode === code)
    return section?.content || ""
  }

  // 操作函数
  async function approveReport() {
    const comment = prompt("请输入审核意见（可选）：")
    try {
      await $fetch(`/api/reports/${reportId.value}/approve`, {
        method: "POST",
        body: { comment }
      })
      await refresh()
    } catch (error: any) {
      alert(error.data?.message || "审核失败")
    }
  }

  async function rejectReport() {
    const comment = prompt("请输入退回原因：")
    if (!comment) {
      alert("必须填写退回原因")
      return
    }
    try {
      await $fetch(`/api/reports/${reportId.value}/reject`, {
        method: "POST",
        body: { comment }
      })
      await refresh()
    } catch (error: any) {
      alert(error.data?.message || "退回失败")
    }
  }

  async function publishReport() {
    if (!confirm("确定要发布此报告吗？发布后将无法修改。")) return

    try {
      await $fetch(`/api/reports/${reportId.value}/publish`, {
        method: "POST"
      })
      await refresh()
    } catch (error: any) {
      alert(error.data?.message || "发布失败")
    }
  }

  async function exportReport(format: "html" | "pdf" | "docx") {
    try {
      const result = await $fetch(`/api/reports/${reportId.value}/export`, {
        method: "POST",
        body: { format }
      })

      if (result.url) {
        window.open(result.url, "_blank")
      } else if (result.content) {
        // HTML 内容，创建下载
        const blob = new Blob([result.content], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${report.value?.title || "report"}.html`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error: any) {
      alert(error.data?.message || "导出失败")
    }
  }

  function formatDate(date: string | Date | null) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  // 简单 Markdown 渲染
  function renderMarkdown(content: string): string {
    if (!content) return '<p class="text-gray-400">暂无内容</p>'

    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="my-2">')
      .replace(/\n/g, "<br>")
  }
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- 返回按钮 -->
    <NuxtLink
      to="/reports"
      class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
    >
      <span class="i-carbon-arrow-left" />
      返回报告列表
    </NuxtLink>

    <!-- 加载状态 -->
    <div v-if="pending" class="text-center py-12">
      <div
        class="i-carbon-progress-bar-round text-4xl text-emerald-500 animate-spin mx-auto mb-4"
      />
      <p class="text-gray-500">加载中...</p>
    </div>

    <template v-else-if="report">
      <!-- 报告头部 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                :class="currentStatus.color"
              >
                <span :class="currentStatus.icon" />
                {{ currentStatus.label }}
              </span>
              <span class="text-sm text-gray-500">v{{ report.version }}</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ report.title }}</h1>
            <p class="text-gray-500">
              {{ report.template?.name }} · {{ formatDate(report.periodStart) }} ~
              {{ formatDate(report.periodEnd) }}
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center gap-2">
            <NuxtLink
              v-if="currentStatus.actions.includes('edit')"
              :to="`/reports/${reportId}/edit`"
              class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span class="i-carbon-edit" />
              编辑
            </NuxtLink>

            <button
              v-if="currentStatus.actions.includes('approve') && isAdmin"
              class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              @click="approveReport"
            >
              <span class="i-carbon-checkmark" />
              通过
            </button>

            <button
              v-if="currentStatus.actions.includes('reject') && isAdmin"
              class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              @click="rejectReport"
            >
              <span class="i-carbon-close" />
              退回
            </button>

            <button
              v-if="currentStatus.actions.includes('publish') && isAdmin"
              class="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              @click="publishReport"
            >
              <span class="i-carbon-cloud-upload" />
              发布
            </button>

            <div v-if="currentStatus.actions.includes('export')" class="relative group">
              <button
                class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span class="i-carbon-download" />
                导出
                <span class="i-carbon-chevron-down text-sm" />
              </button>
              <div
                class="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-10"
              >
                <button
                  class="w-full px-4 py-2 text-left hover:bg-gray-50"
                  @click="exportReport('html')"
                >
                  导出 HTML
                </button>
                <button
                  class="w-full px-4 py-2 text-left hover:bg-gray-50"
                  @click="exportReport('pdf')"
                >
                  导出 PDF
                </button>
                <button
                  class="w-full px-4 py-2 text-left hover:bg-gray-50"
                  @click="exportReport('docx')"
                >
                  导出 Word
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 报告元数据 -->
        <div
          class="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
        >
          <div>
            <span class="text-gray-500">创建人</span>
            <p class="font-medium">{{ report.createdBy?.name || "-" }}</p>
          </div>
          <div>
            <span class="text-gray-500">创建时间</span>
            <p class="font-medium">{{ formatDate(report.createdAt) }}</p>
          </div>
          <div>
            <span class="text-gray-500">审核人</span>
            <p class="font-medium">{{ report.approvedBy?.name || "-" }}</p>
          </div>
          <div>
            <span class="text-gray-500">发布时间</span>
            <p class="font-medium">{{ formatDate(report.publishedAt) }}</p>
          </div>
        </div>
      </div>

      <!-- 报告内容 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">报告内容</h2>
        </div>

        <div class="divide-y divide-gray-200">
          <div
            v-for="section in sections"
            :key="section.code"
            class="p-6"
            :class="section.level === 1 ? '' : 'pl-10'"
          >
            <h3
              class="font-semibold text-gray-900 mb-4"
              :class="section.level === 1 ? 'text-xl' : 'text-lg'"
            >
              {{ section.title }}
            </h3>
            <div
              class="prose prose-sm max-w-none"
              v-html="renderMarkdown(getSectionContent(section.code))"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 404 -->
    <div v-else class="text-center py-12">
      <span class="i-carbon-document-unknown text-5xl text-gray-300 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">报告不存在</h2>
      <p class="text-gray-500 mb-4">该报告可能已被删除或您没有访问权限</p>
      <NuxtLink
        to="/reports"
        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
      >
        返回报告列表
      </NuxtLink>
    </div>
  </div>
</template>
