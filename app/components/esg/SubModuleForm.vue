<template>
  <div class="space-y-6">
    <!-- 表单头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-emerald-800 dark:text-emerald-100">
          {{ subModule?.name || "数据录入" }}
        </h2>
        <p class="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
          {{ subModule?.description || "请填写以下指标数据" }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- 周期选择 -->
        <UFormField label="报告周期" name="period">
          <USelect v-model="selectedPeriod" :items="periodOptions" class="w-32" />
        </UFormField>
      </div>
    </div>

    <!-- 合规检查状态卡片 -->
    <UCard v-if="showComplianceStatus" class="shadow-md" :class="complianceStatusCardClass">
      <div class="flex items-start gap-3">
        <UIcon
          :name="complianceStatusIcon"
          class="text-2xl mt-0.5"
          :class="complianceStatusIconClass"
        />
        <div class="flex-1">
          <h4 class="font-semibold" :class="complianceStatusTextClass">
            {{ complianceStatusTitle }}
          </h4>
          <p class="text-sm mt-1 opacity-80">
            检查了 {{ lastBatchResult?.summary.total || 0 }} 项指标， 通过
            {{ lastBatchResult?.summary.passed || 0 }} 项， 警告
            {{ lastBatchResult?.summary.warnings || 0 }} 项， 失败
            {{ lastBatchResult?.summary.failed || 0 }} 项
          </p>
          <!-- 错误列表 -->
          <div v-if="lastBatchResult?.errors.length" class="mt-3 space-y-1">
            <div
              v-for="(err, idx) in lastBatchResult.errors.slice(0, 5)"
              :key="idx"
              class="text-sm flex items-start gap-2"
            >
              <UIcon name="i-heroicons-x-circle" class="text-red-500 mt-0.5 flex-shrink-0" />
              <span>{{ err.message }}</span>
            </div>
            <p v-if="lastBatchResult.errors.length > 5" class="text-sm text-gray-500">
              还有 {{ lastBatchResult.errors.length - 5 }} 个错误...
            </p>
          </div>
          <!-- 警告列表 -->
          <div
            v-if="lastBatchResult?.warnings.length && !lastBatchResult?.errors.length"
            class="mt-3 space-y-1"
          >
            <div
              v-for="(warn, idx) in lastBatchResult.warnings.slice(0, 3)"
              :key="idx"
              class="text-sm flex items-start gap-2"
            >
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="text-amber-500 mt-0.5 flex-shrink-0"
              />
              <span>{{ warn.message }}</span>
            </div>
            <p v-if="lastBatchResult.warnings.length > 3" class="text-sm text-gray-500">
              还有 {{ lastBatchResult.warnings.length - 3 }} 个警告...
            </p>
          </div>
        </div>
        <UButton color="neutral" variant="ghost" size="xs" @click="showComplianceStatus = false">
          <UIcon name="i-heroicons-x-mark" />
        </UButton>
      </div>
    </UCard>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="text-4xl text-emerald-500 animate-spin" />
    </div>

    <!-- 表单内容 -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-8">
      <!-- 按分类分组渲染 -->
      <template v-for="category in categories" :key="category.id">
        <UCard class="shadow-lg shadow-emerald-500/10">
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
              >
                <UIcon name="i-heroicons-folder" class="text-white text-sm" />
              </div>
              <div>
                <h3 class="font-semibold text-emerald-800 dark:text-emerald-100">
                  {{ category.code }} {{ category.name }}
                </h3>
              </div>
            </div>
          </template>

          <div class="space-y-6">
            <!-- 四级分类 -->
            <template v-for="subCategory in category.children || []" :key="subCategory.id">
              <div class="border-l-2 border-emerald-200 dark:border-emerald-700 pl-4">
                <h4 class="font-medium text-emerald-700 dark:text-emerald-200 mb-4">
                  {{ subCategory.code }} {{ subCategory.name }}
                </h4>

                <!-- 指标字段 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <template v-for="metric in subCategory.metrics || []" :key="metric.id">
                    <EsgMetricField
                      v-model="formData[metric.code]"
                      :metric="metric"
                      :error="errors[metric.code]"
                      :compliance-state="getMetricState(metric.code)"
                      :enable-realtime-check="enableRealtimeCheck"
                      @compliance-check="handleRealtimeCheck"
                    />
                  </template>
                </div>
              </div>
            </template>

            <!-- 直接属于该分类的指标 -->
            <div v-if="category.metrics?.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <template v-for="metric in category.metrics" :key="metric.id">
                <EsgMetricField
                  v-model="formData[metric.code]"
                  :metric="metric"
                  :error="errors[metric.code]"
                  :compliance-state="getMetricState(metric.code)"
                  :enable-realtime-check="enableRealtimeCheck"
                  @compliance-check="handleRealtimeCheck"
                />
              </template>
            </div>
          </div>
        </UCard>
      </template>

      <!-- 提交按钮 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UCheckbox v-model="enableRealtimeCheck" label="启用实时合规检查" />
        </div>
        <div class="flex gap-3">
          <UButton color="neutral" variant="outline" @click="handleReset">
            <UIcon name="i-heroicons-arrow-path" class="mr-2" />
            重置
          </UButton>
          <UButton color="neutral" variant="soft" @click="handleSaveDraft" :loading="saving">
            <UIcon name="i-heroicons-document" class="mr-2" />
            保存草稿
          </UButton>
          <UButton color="info" variant="soft" @click="handlePreCheck" :loading="isChecking">
            <UIcon name="i-heroicons-shield-check" class="mr-2" />
            合规预检
          </UButton>
          <UButton type="submit" color="primary" :loading="saving" :disabled="hasBlockingErrors">
            <UIcon name="i-heroicons-check" class="mr-2" />
            提交数据
          </UButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
  import { useComplianceCheck } from "~/composables/useComplianceCheck"

  interface MetricConfig {
    unit?: string
    options?: Array<{ label: string; value: string }>
    min?: number
    max?: number
    placeholder?: string
    tooltip?: string
  }

  interface Metric {
    id: number
    code: string
    name: string
    fieldType: string
    fieldConfig: MetricConfig | null
    required: boolean
  }

  interface Category {
    id: number
    code: string
    name: string
    metrics?: Metric[]
    children?: Category[]
  }

  interface SubModule {
    id: number
    code: string
    name: string
    description?: string
    categories: Category[]
  }

  const props = defineProps<{
    subModuleCode: string
  }>()

  const emit = defineEmits<{
    (e: "saved", data: any): void
    (e: "submitted", data: any): void
  }>()

  const toast = useToast()

  // 状态
  const loading = ref(true)
  const saving = ref(false)
  const subModule = ref<SubModule | null>(null)
  const categories = ref<Category[]>([])
  const formData = ref<Record<string, any>>({})
  const errors = ref<Record<string, string>>({})

  // 合规检查相关状态
  const enableRealtimeCheck = ref(false)
  const showComplianceStatus = ref(false)

  // 周期选项
  const currentYear = new Date().getFullYear()
  const periodOptions = [
    { label: `${currentYear}年`, value: String(currentYear) },
    { label: `${currentYear - 1}年`, value: String(currentYear - 1) },
    { label: `${currentYear}年Q1`, value: `${currentYear}-Q1` },
    { label: `${currentYear}年Q2`, value: `${currentYear}-Q2` },
    { label: `${currentYear}年Q3`, value: `${currentYear}-Q3` },
    { label: `${currentYear}年Q4`, value: `${currentYear}-Q4` }
  ]
  const selectedPeriod = ref(String(currentYear))

  // 合规检查 composable
  const {
    isChecking,
    lastBatchResult,
    hasBlockingErrors,
    hasWarnings,
    getMetricState,
    clearAllStates,
    checkSingle,
    checkBatch
  } = useComplianceCheck(selectedPeriod)

  // 合规状态卡片样式
  const complianceStatusCardClass = computed(() => {
    if (!lastBatchResult.value) return ""
    if (lastBatchResult.value.errors.length > 0) {
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    }
    if (lastBatchResult.value.warnings.length > 0) {
      return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
    }
    return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
  })

  const complianceStatusIcon = computed(() => {
    if (!lastBatchResult.value) return "i-heroicons-shield-check"
    if (lastBatchResult.value.errors.length > 0) return "i-heroicons-x-circle"
    if (lastBatchResult.value.warnings.length > 0) return "i-heroicons-exclamation-triangle"
    return "i-heroicons-check-circle"
  })

  const complianceStatusIconClass = computed(() => {
    if (!lastBatchResult.value) return "text-gray-500"
    if (lastBatchResult.value.errors.length > 0) return "text-red-500"
    if (lastBatchResult.value.warnings.length > 0) return "text-amber-500"
    return "text-green-500"
  })

  const complianceStatusTextClass = computed(() => {
    if (!lastBatchResult.value) return "text-gray-700 dark:text-gray-300"
    if (lastBatchResult.value.errors.length > 0) return "text-red-700 dark:text-red-300"
    if (lastBatchResult.value.warnings.length > 0) return "text-amber-700 dark:text-amber-300"
    return "text-green-700 dark:text-green-300"
  })

  const complianceStatusTitle = computed(() => {
    if (!lastBatchResult.value) return "合规检查"
    if (lastBatchResult.value.errors.length > 0) return "合规检查未通过"
    if (lastBatchResult.value.warnings.length > 0) return "合规检查通过（有警告）"
    return "合规检查全部通过"
  })

  // 获取 Schema
  const fetchSchema = async () => {
    loading.value = true
    try {
      const { data } = await useFetch(`/api/esg/schema?subModule=${props.subModuleCode}`)
      if (data.value?.success && data.value.data) {
        const responseData = data.value.data as any

        // 处理不同的返回格式
        let foundSubModule = null

        if (Array.isArray(responseData)) {
          // 返回数组格式：遍历所有模块找到对应的子模块
          for (const module of responseData) {
            if (module.subModules?.length) {
              const found = module.subModules.find((s: any) => s.code === props.subModuleCode)
              if (found) {
                foundSubModule = found
                break
              }
            }
          }
        } else if (responseData.subModules?.length) {
          // 返回单个模块对象
          foundSubModule =
            responseData.subModules.find((s: any) => s.code === props.subModuleCode) ||
            responseData.subModules[0]
        } else if (responseData.categories) {
          // 直接返回子模块对象
          foundSubModule = responseData
        }

        if (foundSubModule) {
          subModule.value = foundSubModule
          categories.value = foundSubModule.categories || []
        }

        initFormData()
      }
    } catch (e) {
      console.error("获取 Schema 失败", e)
    } finally {
      loading.value = false
    }
  }

  // 获取已有记录
  const fetchRecords = async () => {
    try {
      const { data } = await useFetch(
        `/api/esg/records?subModule=${props.subModuleCode}&period=${selectedPeriod.value}`
      )
      if (data.value?.success && data.value.data) {
        const records = data.value.data as any[]
        records.forEach((record) => {
          if (record.metric?.code) {
            const value =
              record.valueNumber ?? record.valueText ?? (record.valueJson ? record.valueJson : null)
            if (value !== null) {
              formData.value[record.metric.code] = value
            }
          }
        })
      }
    } catch (e) {
      console.error("获取记录失败", e)
    }
  }

  // 初始化表单数据
  const initFormData = () => {
    formData.value = {}
    errors.value = {}

    const processCategory = (category: Category) => {
      category.metrics?.forEach((metric) => {
        formData.value[metric.code] = getDefaultValue(metric)
      })
      category.children?.forEach(processCategory)
    }

    categories.value.forEach(processCategory)
  }

  // 获取默认值
  const getDefaultValue = (metric: Metric) => {
    switch (metric.fieldType) {
      case "number":
        return null
      case "select":
        return ""
      case "multiselect":
        return []
      case "date":
        return ""
      default:
        return ""
    }
  }

  // 验证表单
  const validateForm = (): boolean => {
    errors.value = {}
    let isValid = true

    const processCategory = (category: Category) => {
      category.metrics?.forEach((metric) => {
        if (metric.required) {
          const value = formData.value[metric.code]
          if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
            errors.value[metric.code] = "此项为必填"
            isValid = false
          }
        }

        // 数值范围验证
        if (metric.fieldType === "number" && formData.value[metric.code] !== null) {
          const config = metric.fieldConfig
          const value = formData.value[metric.code]
          if (config?.min !== undefined && value < config.min) {
            errors.value[metric.code] = `最小值为 ${config.min}`
            isValid = false
          }
          if (config?.max !== undefined && value > config.max) {
            errors.value[metric.code] = `最大值为 ${config.max}`
            isValid = false
          }
        }
      })
      category.children?.forEach(processCategory)
    }

    categories.value.forEach(processCategory)
    return isValid
  }

  // 实时合规检查
  const handleRealtimeCheck = async (metricCode: string, value: any) => {
    if (!enableRealtimeCheck.value) return

    const metric = findMetric(metricCode)
    if (!metric) return

    await checkSingle(
      metricCode,
      value,
      metric.fieldType === "number"
        ? typeof value === "number"
          ? value
          : parseFloat(value) || null
        : null,
      metric.fieldType !== "number" ? String(value || "") : null
    )
  }

  // 查找指标
  const findMetric = (code: string): Metric | undefined => {
    let found: Metric | undefined

    const search = (category: Category) => {
      if (found) return
      found = category.metrics?.find((m) => m.code === code)
      if (!found) {
        category.children?.forEach(search)
      }
    }

    categories.value.forEach(search)
    return found
  }

  // 构建检查数据
  const buildCheckData = () => {
    const records: Array<{
      metricCode: string
      value: any
      valueNumber?: number | null
      valueText?: string | null
      valueJson?: any
    }> = []

    const processCategory = (category: Category) => {
      category.metrics?.forEach((metric) => {
        const value = formData.value[metric.code]
        if (value !== null && value !== undefined && value !== "") {
          records.push({
            metricCode: metric.code,
            value,
            valueNumber:
              metric.fieldType === "number"
                ? typeof value === "number"
                  ? value
                  : parseFloat(value) || null
                : null,
            valueText: metric.fieldType !== "number" && typeof value === "string" ? value : null,
            valueJson: typeof value === "object" ? value : undefined
          })
        }
      })
      category.children?.forEach(processCategory)
    }

    categories.value.forEach(processCategory)
    return records
  }

  // 合规预检
  const handlePreCheck = async () => {
    const checkData = buildCheckData()

    if (checkData.length === 0) {
      toast.add({
        title: "无数据检查",
        description: "请先填写数据后再进行合规检查",
        color: "warning"
      })
      return
    }

    const result = await checkBatch(checkData)
    showComplianceStatus.value = true

    if (result.errors.length > 0) {
      toast.add({
        title: "合规检查未通过",
        description: `发现 ${result.errors.length} 个错误，${result.warnings.length} 个警告`,
        color: "error"
      })
    } else if (result.warnings.length > 0) {
      toast.add({
        title: "合规检查完成",
        description: `通过检查，但有 ${result.warnings.length} 个警告需要关注`,
        color: "warning"
      })
    } else {
      toast.add({
        title: "合规检查通过",
        description: "所有指标均符合合规要求",
        color: "success"
      })
    }
  }

  // 保存草稿
  const handleSaveDraft = async () => {
    saving.value = true
    try {
      const { data, error } = await useFetch("/api/esg/records.batch", {
        method: "POST",
        body: {
          subModuleCode: props.subModuleCode,
          period: selectedPeriod.value,
          records: formData.value,
          status: "draft",
          skipComplianceCheck: true // 草稿不进行合规检查
        }
      })

      if (error.value) {
        throw error.value
      }

      toast.add({
        title: "保存成功",
        description: "草稿已保存",
        color: "success"
      })

      emit("saved", data.value)
    } catch (e: any) {
      toast.add({
        title: "保存失败",
        description: e.data?.message || e.message,
        color: "error"
      })
    } finally {
      saving.value = false
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.add({
        title: "验证失败",
        description: "请检查必填项",
        color: "warning"
      })
      return
    }

    // 提交前执行合规检查
    const checkData = buildCheckData()
    if (checkData.length > 0) {
      const result = await checkBatch(checkData)
      showComplianceStatus.value = true

      // 如果有阻断性错误，不允许提交
      if (result.errors.some((e) => e.severity === "error")) {
        toast.add({
          title: "合规检查未通过",
          description: "存在必须解决的合规问题，无法提交",
          color: "error"
        })
        return
      }

      // 如果有警告，提示用户确认
      if (result.warnings.length > 0) {
        const confirmed = confirm(`合规检查发现 ${result.warnings.length} 个警告，是否仍然提交？`)
        if (!confirmed) return
      }
    }

    saving.value = true
    try {
      const { data, error } = await useFetch("/api/esg/records.batch", {
        method: "POST",
        body: {
          subModuleCode: props.subModuleCode,
          period: selectedPeriod.value,
          records: formData.value,
          status: "submitted"
        }
      })

      if (error.value) {
        // 检查是否是合规错误
        const errorData = error.value.data
        if (errorData?.data?.errors) {
          showComplianceStatus.value = true
          toast.add({
            title: "合规检查未通过",
            description: errorData.message || "提交失败",
            color: "error"
          })
          return
        }
        throw error.value
      }

      // 检查响应中的合规警告
      const responseData = data.value as any
      if (responseData?.compliance?.warnings > 0) {
        toast.add({
          title: "提交成功（有警告）",
          description: `数据已提交，但有 ${responseData.compliance.warnings} 个合规警告`,
          color: "warning"
        })
      } else {
        toast.add({
          title: "提交成功",
          description: "数据已提交",
          color: "success"
        })
      }

      emit("submitted", data.value)
    } catch (e: any) {
      toast.add({
        title: "提交失败",
        description: e.data?.message || e.message,
        color: "error"
      })
    } finally {
      saving.value = false
    }
  }

  // 重置表单
  const handleReset = () => {
    initFormData()
    clearAllStates()
    showComplianceStatus.value = false
  }

  // 监听周期变化
  watch(selectedPeriod, () => {
    initFormData()
    clearAllStates()
    showComplianceStatus.value = false
    fetchRecords()
  })

  // 初始化
  onMounted(async () => {
    await fetchSchema()
    await fetchRecords()
  })
</script>
