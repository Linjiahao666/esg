<script setup lang="ts">
  definePageMeta({
    middleware: ["auth"]
  })

  const route = useRoute()
  const reportId = computed(() => route.params.id as string)

  // 获取报告详情
  const { data: report, pending, refresh } = await useFetch(`/api/reports/${reportId.value}`)

  // 状态
  const activeSection = ref<string | null>(null)
  const generating = ref(false)
  const generatingSection = ref<string | null>(null)
  const progress = ref(0)
  const progressMessage = ref("")
  const saving = ref(false)

  // 编辑器内容
  const editContent = ref("")

  // 解析章节配置
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

  // 获取章节状态
  function getSectionStatus(code: string) {
    const section = report.value?.sections?.find((s: any) => s.sectionCode === code)
    if (!section) return "empty"
    if (section.aiGenerated && !section.humanEdited) return "ai"
    if (section.humanEdited) return "edited"
    return "draft"
  }

  // 选择章节
  function selectSection(code: string) {
    activeSection.value = code
    editContent.value = getSectionContent(code)
  }

  // 保存章节内容
  async function saveSection() {
    if (!activeSection.value) return

    saving.value = true
    try {
      await $fetch(`/api/reports/${reportId.value}/sections/${activeSection.value}`, {
        method: "PUT",
        body: { content: editContent.value }
      })
      await refresh()
    } catch (error: any) {
      alert(error.data?.message || "保存失败")
    } finally {
      saving.value = false
    }
  }

  // AI 生成单个章节
  async function generateSectionAI() {
    if (!activeSection.value) return

    generatingSection.value = activeSection.value
    try {
      const result = await $fetch(`/api/reports/${reportId.value}/ai/generate`, {
        method: "POST",
        body: { sectionCode: activeSection.value }
      })

      editContent.value = result.content
      await refresh()
    } catch (error: any) {
      alert(error.data?.message || "AI 生成失败")
    } finally {
      generatingSection.value = null
    }
  }

  // 生成完整报告
  async function generateFullReport() {
    if (!confirm("将使用 AI 生成所有章节内容，已编辑的内容将被覆盖。确定继续？")) {
      return
    }

    generating.value = true
    progress.value = 0
    progressMessage.value = "准备生成报告..."

    try {
      // 开始生成任务
      await $fetch(`/api/reports/${reportId.value}/generate`, {
        method: "POST"
      })

      // 轮询进度
      const pollProgress = async () => {
        const status = await $fetch(`/api/reports/${reportId.value}/progress`)
        progress.value = status.progress || 0
        progressMessage.value = status.message || ""

        if (status.status === "completed") {
          await refresh()
          generating.value = false
          activeSection.value = sections.value[0]?.code || null
          if (activeSection.value) {
            editContent.value = getSectionContent(activeSection.value)
          }
        } else if (status.status === "failed") {
          alert("报告生成失败：" + status.message)
          generating.value = false
        } else {
          setTimeout(pollProgress, 2000)
        }
      }

      setTimeout(pollProgress, 1000)
    } catch (error: any) {
      alert(error.data?.message || "生成失败")
      generating.value = false
    }
  }

  // 提交审核
  async function submitForReview() {
    if (!confirm("确定要提交报告进行审核吗？")) return

    try {
      await $fetch(`/api/reports/${reportId.value}/submit`, { method: "POST" })
      await refresh()
      navigateTo(`/reports/${reportId.value}`)
    } catch (error: any) {
      alert(error.data?.message || "提交失败")
    }
  }

  // 返回详情页
  function goBack() {
    navigateTo(`/reports/${reportId.value}`)
  }
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- 顶部工具栏 -->
    <header class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="goBack">
          <span class="i-carbon-arrow-left text-xl" />
        </button>
        <div>
          <h1 class="font-semibold text-gray-900">{{ report?.title }}</h1>
          <p class="text-sm text-gray-500">编辑报告</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          :disabled="generating"
          @click="generateFullReport"
        >
          <span class="i-carbon-machine-learning text-lg" />
          AI 生成全部
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          :disabled="report?.status !== 'draft'"
          @click="submitForReview"
        >
          <span class="i-carbon-send-alt text-lg" />
          提交审核
        </button>
      </div>
    </header>

    <!-- 生成进度条 -->
    <div v-if="generating" class="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div class="flex items-center gap-4">
        <div class="i-carbon-progress-bar-round text-blue-500 animate-spin" />
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm text-blue-700">{{ progressMessage }}</span>
            <span class="text-sm text-blue-700">{{ progress }}%</span>
          </div>
          <div class="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 transition-all duration-500"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 章节导航 -->
      <aside class="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div class="p-4">
          <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">报告章节</h2>
          <nav class="space-y-1">
            <button
              v-for="section in sections"
              :key="section.code"
              class="w-full text-left px-3 py-2 rounded-lg transition-colors"
              :class="[
                activeSection === section.code
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'hover:bg-gray-50 text-gray-700',
                section.level === 2 ? 'pl-6 text-sm' : 'font-medium'
              ]"
              @click="selectSection(section.code)"
            >
              <div class="flex items-center justify-between">
                <span>{{ section.title }}</span>
                <span
                  v-if="getSectionStatus(section.code) === 'ai'"
                  class="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded"
                >
                  AI
                </span>
                <span
                  v-else-if="getSectionStatus(section.code) === 'edited'"
                  class="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded"
                >
                  已编辑
                </span>
                <span
                  v-else-if="getSectionStatus(section.code) === 'empty'"
                  class="w-2 h-2 bg-gray-300 rounded-full"
                />
              </div>
            </button>
          </nav>
        </div>
      </aside>

      <!-- 编辑区 -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <div v-if="!activeSection" class="flex-1 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <span class="i-carbon-document-blank text-5xl text-gray-300 mb-4" />
            <p>请从左侧选择要编辑的章节</p>
          </div>
        </div>

        <template v-else>
          <!-- 编辑器工具栏 -->
          <div
            class="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-gray-900">
                {{ sections.find((s) => s.code === activeSection)?.title }}
              </h3>
              <span
                v-if="getSectionStatus(activeSection) === 'ai'"
                class="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded"
              >
                AI 生成
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                :disabled="generatingSection === activeSection"
                @click="generateSectionAI"
              >
                <span
                  v-if="generatingSection === activeSection"
                  class="i-carbon-progress-bar-round animate-spin"
                />
                <span v-else class="i-carbon-machine-learning" />
                AI 重新生成
              </button>
              <button
                class="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                :disabled="saving"
                @click="saveSection"
              >
                <span v-if="saving" class="i-carbon-progress-bar-round animate-spin" />
                <span v-else class="i-carbon-save" />
                保存
              </button>
            </div>
          </div>

          <!-- Markdown 编辑器 -->
          <div class="flex-1 p-4 overflow-hidden">
            <textarea
              v-model="editContent"
              class="w-full h-full p-4 border border-gray-300 rounded-lg resize-none font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="在此输入章节内容（支持 Markdown 格式）..."
            />
          </div>
        </template>
      </main>

      <!-- 预览区（可选） -->
      <aside
        v-if="activeSection && editContent"
        class="w-96 bg-white border-l border-gray-200 overflow-y-auto hidden xl:block"
      >
        <div class="p-4">
          <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">预览</h2>
          <div class="prose prose-sm max-w-none" v-html="renderMarkdown(editContent)" />
        </div>
      </aside>
    </div>
  </div>
</template>

<script lang="ts">
  // Markdown 渲染（简单实现）
  function renderMarkdown(content: string): string {
    if (!content) return ""

    return (
      content
        // 标题
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
        // 粗体/斜体
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // 列表
        .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
        // 段落
        .replace(/\n\n/g, '</p><p class="my-2">')
        // 换行
        .replace(/\n/g, "<br>")
    )
  }
</script>
