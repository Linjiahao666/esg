<template>
  <div class="w-full">
    <!-- 拖拽上传区域 -->
    <div
      class="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300"
      :class="[
        isDragging
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
          : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="acceptTypes"
        class="hidden"
        @change="handleFileSelect"
      />

      <div class="flex flex-col items-center gap-4">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center transition-colors"
          :class="
            isDragging
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300'
          "
        >
          <UIcon
            :name="isDragging ? 'i-heroicons-arrow-down-tray' : 'i-heroicons-cloud-arrow-up'"
            class="text-3xl"
          />
        </div>

        <div>
          <p class="text-lg font-medium text-emerald-800 dark:text-emerald-100">
            {{ isDragging ? "释放文件以上传" : "拖拽文件到此处" }}
          </p>
          <p class="text-sm text-emerald-500 dark:text-emerald-400 mt-1">
            或 <span class="text-emerald-600 dark:text-emerald-300 font-medium">点击选择文件</span>
          </p>
        </div>

        <div class="text-xs text-emerald-400 dark:text-emerald-500">
          支持 {{ acceptLabel }} • 最大 {{ maxSizeLabel }}
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="files.length > 0" class="mt-6 space-y-3">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center gap-4 p-4 bg-white dark:bg-emerald-900/50 rounded-xl border border-emerald-100 dark:border-emerald-800"
      >
        <!-- 文件图标 -->
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center"
          :class="getFileIconClass(file.type)"
        >
          <UIcon :name="getFileIcon(file.type)" class="text-2xl" />
        </div>

        <!-- 文件信息 -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-emerald-800 dark:text-emerald-100 truncate">
            {{ file.name }}
          </p>
          <p class="text-xs text-emerald-500">{{ formatFileSize(file.size) }}</p>
        </div>

        <!-- 上传进度 / 状态 -->
        <div v-if="file.status === 'uploading'" class="w-24">
          <UProgress :value="file.progress" color="primary" size="sm" />
        </div>
        <div v-else-if="file.status === 'success'" class="text-emerald-500">
          <UIcon name="i-heroicons-check-circle" class="text-xl" />
        </div>
        <div v-else-if="file.status === 'error'" class="text-red-500">
          <UIcon name="i-heroicons-x-circle" class="text-xl" />
        </div>

        <!-- 删除按钮 -->
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-heroicons-x-mark"
          @click="removeFile(index)"
        />
      </div>
    </div>

    <!-- 上传按钮 -->
    <div v-if="files.length > 0 && !autoUpload" class="mt-4 flex justify-end gap-3">
      <UButton color="neutral" variant="outline" @click="clearFiles"> 清空 </UButton>
      <UButton color="primary" :loading="isUploading" @click="uploadFiles">
        <UIcon name="i-heroicons-arrow-up-tray" class="mr-2" />
        上传 {{ files.length }} 个文件
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface UploadFile {
    file: File
    name: string
    size: number
    type: string
    status: "pending" | "uploading" | "success" | "error"
    progress: number
    response?: any
    error?: string
  }

  const props = withDefaults(
    defineProps<{
      multiple?: boolean
      accept?: string[]
      maxSize?: number // bytes
      category?: string
      autoUpload?: boolean
    }>(),
    {
      multiple: true,
      accept: () => ["image/*", "application/pdf", ".doc", ".docx", ".xls", ".xlsx"],
      maxSize: 10 * 1024 * 1024, // 10MB
      category: "general",
      autoUpload: false
    }
  )

  const emit = defineEmits<{
    (e: "uploaded", files: any[]): void
    (e: "error", error: string): void
  }>()

  const toast = useToast()
  const fileInput = ref<HTMLInputElement>()
  const isDragging = ref(false)
  const isUploading = ref(false)
  const files = ref<UploadFile[]>([])

  const acceptTypes = computed(() => props.accept.join(","))
  const acceptLabel = computed(() => {
    const types = props.accept.map((t) => {
      if (t.startsWith("image/")) return "图片"
      if (t.includes("pdf")) return "PDF"
      if (t.includes("doc")) return "Word"
      if (t.includes("xls")) return "Excel"
      return t
    })
    return [...new Set(types)].join("、")
  })
  const maxSizeLabel = computed(() => formatFileSize(props.maxSize))

  const triggerFileInput = () => {
    fileInput.value?.click()
  }

  const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files) {
      addFiles(Array.from(input.files))
    }
    // 重置 input 以允许选择相同文件
    input.value = ""
  }

  const handleDrop = (event: DragEvent) => {
    isDragging.value = false
    if (event.dataTransfer?.files) {
      addFiles(Array.from(event.dataTransfer.files))
    }
  }

  const addFiles = (newFiles: File[]) => {
    for (const file of newFiles) {
      // 检查文件大小
      if (file.size > props.maxSize) {
        toast.add({
          title: "文件过大",
          description: `${file.name} 超过大小限制`,
          color: "error"
        })
        continue
      }

      // 检查是否已存在
      if (files.value.some((f) => f.name === file.name && f.size === file.size)) {
        continue
      }

      files.value.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "pending",
        progress: 0
      })
    }

    // 自动上传
    if (props.autoUpload && files.value.length > 0) {
      uploadFiles()
    }
  }

  const removeFile = (index: number) => {
    files.value.splice(index, 1)
  }

  const clearFiles = () => {
    files.value = []
  }

  const uploadFiles = async () => {
    if (files.value.length === 0) return

    isUploading.value = true
    const uploadedFiles: any[] = []

    for (const fileItem of files.value) {
      if (fileItem.status === "success") {
        uploadedFiles.push(fileItem.response)
        continue
      }

      fileItem.status = "uploading"
      fileItem.progress = 0

      try {
        const formData = new FormData()
        formData.append("file", fileItem.file)

        const response = await $fetch(`/api/files/upload?category=${props.category}`, {
          method: "POST",
          body: formData
        })

        fileItem.status = "success"
        fileItem.progress = 100
        fileItem.response = (response as any).files[0]
        uploadedFiles.push(fileItem.response)
      } catch (error: any) {
        fileItem.status = "error"
        fileItem.error = error.data?.message || "上传失败"
        emit("error", fileItem.error || "上传失败")
        toast.add({
          title: "上传失败",
          description: fileItem.error,
          color: "error"
        })
      }
    }

    isUploading.value = false

    if (uploadedFiles.length > 0) {
      emit("uploaded", uploadedFiles)
      toast.add({
        title: "上传成功",
        description: `成功上传 ${uploadedFiles.length} 个文件`,
        color: "success"
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

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

  // 暴露方法
  defineExpose({
    uploadFiles,
    clearFiles
  })
</script>
