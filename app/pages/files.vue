<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-3xl font-bold text-emerald-800 dark:text-emerald-100">文件管理</h1>
      <p class="text-emerald-600 dark:text-emerald-400 mt-2">上传和管理您的 ESG 相关文档和报告</p>
    </div>

    <!-- 上传区域 -->
    <UCard class="shadow-lg shadow-emerald-500/10">
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-cloud-arrow-up" class="text-white text-xl" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-emerald-800 dark:text-emerald-100">上传文件</h2>
            <p class="text-sm text-emerald-600 dark:text-emerald-400">
              支持图片、PDF、Word、Excel 等格式
            </p>
          </div>
        </div>
      </template>

      <FileUpload
        :multiple="true"
        :max-size="10 * 1024 * 1024"
        category="esg-report"
        @uploaded="handleUploaded"
      />
    </UCard>

    <!-- 文件列表 -->
    <UCard class="shadow-lg shadow-emerald-500/10">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
            >
              <UIcon name="i-heroicons-folder" class="text-white text-xl" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-emerald-800 dark:text-emerald-100">
                已上传文件
              </h2>
              <p class="text-sm text-emerald-600 dark:text-emerald-400">
                共 {{ files.length }} 个文件
              </p>
            </div>
          </div>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-path"
            :loading="refreshing"
            @click="refreshFiles"
          >
            刷新
          </UButton>
        </div>
      </template>

      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="text-4xl text-emerald-500 animate-spin" />
      </div>

      <div v-else-if="files.length === 0" class="text-center py-12">
        <UIcon
          name="i-heroicons-folder-open"
          class="text-6xl text-emerald-300 dark:text-emerald-700 mx-auto mb-4"
        />
        <p class="text-emerald-600 dark:text-emerald-400">暂无上传文件</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="file in files"
          :key="file.id"
          class="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors"
        >
          <!-- 文件图标 -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="getFileIconClass(file.mimeType)"
          >
            <UIcon :name="getFileIcon(file.mimeType)" class="text-2xl" />
          </div>

          <!-- 文件信息 -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-emerald-800 dark:text-emerald-100 truncate">
              {{ file.originalName }}
            </p>
            <p class="text-xs text-emerald-500">
              {{ formatFileSize(file.size) }} • {{ formatDate(file.createdAt) }}
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-eye"
              @click="viewFile(file)"
            />
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-arrow-down-tray"
              @click="downloadFile(file)"
            />
            <UButton
              color="error"
              variant="ghost"
              size="sm"
              icon="i-heroicons-trash"
              :loading="deleting === file.id"
              @click="deleteFile(file)"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
  interface FileItem {
    id: number
    filename: string
    originalName: string
    mimeType: string
    size: number
    category: string
    url: string
    createdAt: string
  }

  const toast = useToast()
  const files = ref<FileItem[]>([])
  const loading = ref(true)
  const refreshing = ref(false)
  const deleting = ref<number | null>(null)

  // 获取文件列表
  const fetchFiles = async () => {
    try {
      const { data, error } = await useFetch("/api/files")
      if (error.value) {
        if (error.value.statusCode === 401) {
          navigateTo("/login")
          return
        }
        throw error.value
      }
      files.value = (data.value?.files as FileItem[]) || []
    } catch (e: any) {
      toast.add({
        title: "获取文件列表失败",
        description: e.message,
        color: "error"
      })
    } finally {
      loading.value = false
    }
  }

  // 刷新文件列表
  const refreshFiles = async () => {
    refreshing.value = true
    await fetchFiles()
    refreshing.value = false
  }

  // 上传完成回调
  const handleUploaded = (uploadedFiles: FileItem[]) => {
    files.value = [...uploadedFiles, ...files.value]
  }

  // 查看文件
  const viewFile = (file: FileItem) => {
    window.open(file.url, "_blank")
  }

  // 下载文件
  const downloadFile = (file: FileItem) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 删除文件
  const deleteFile = async (file: FileItem) => {
    if (!confirm(`确定要删除 "${file.originalName}" 吗？`)) return

    deleting.value = file.id

    try {
      const { error } = await useFetch(`/api/files/${file.id}`, {
        method: "DELETE"
      })

      if (error.value) {
        throw error.value
      }

      files.value = files.value.filter((f) => f.id !== file.id)
      toast.add({
        title: "删除成功",
        color: "success"
      })
    } catch (e: any) {
      toast.add({
        title: "删除失败",
        description: e.data?.message || e.message,
        color: "error"
      })
    } finally {
      deleting.value = null
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // 获取文件图标
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "i-heroicons-photo"
    if (mimeType.includes("pdf")) return "i-heroicons-document-text"
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "i-heroicons-document-text"
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "i-heroicons-table-cells"
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "i-heroicons-presentation-chart-bar"
    return "i-heroicons-document"
  }

  // 获取文件图标样式
  const getFileIconClass = (mimeType: string): string => {
    if (mimeType.startsWith("image/"))
      return "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
    if (mimeType.includes("pdf"))
      return "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
    return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
  }

  // 初始化
  onMounted(() => {
    fetchFiles()
  })
</script>
