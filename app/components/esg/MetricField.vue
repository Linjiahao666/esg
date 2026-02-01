<template>
  <div class="relative">
    <UFormField
      :label="label"
      :name="metric.code"
      :error="error || complianceError"
      :help="metric.fieldConfig?.tooltip"
    >
      <!-- 数值输入 -->
      <template v-if="metric.fieldType === 'number'">
        <UInput
          :model-value="modelValue"
          @update:model-value="handleValueChange"
          @blur="handleBlur"
          type="number"
          :placeholder="metric.fieldConfig?.placeholder || '请输入'"
          :min="metric.fieldConfig?.min"
          :max="metric.fieldConfig?.max"
          class="rounded-xl"
          :class="inputStateClass"
        >
          <template v-if="metric.fieldConfig?.unit" #trailing>
            <span class="text-emerald-500 text-sm">{{ metric.fieldConfig.unit }}</span>
          </template>
        </UInput>
      </template>

      <!-- 文本输入 -->
      <template v-else-if="metric.fieldType === 'text'">
        <UInput
          :model-value="modelValue"
          @update:model-value="handleValueChange"
          @blur="handleBlur"
          :placeholder="metric.fieldConfig?.placeholder || '请输入'"
          class="rounded-xl"
          :class="inputStateClass"
        />
      </template>

      <!-- 多行文本 -->
      <template v-else-if="metric.fieldType === 'textarea'">
        <UTextarea
          :model-value="modelValue"
          @update:model-value="handleValueChange"
          @blur="handleBlur"
          :placeholder="metric.fieldConfig?.placeholder || '请输入'"
          :rows="3"
          class="rounded-xl"
          :class="inputStateClass"
        />
      </template>

      <!-- 单选 -->
      <template v-else-if="metric.fieldType === 'select'">
        <USelect
          :model-value="modelValue || null"
          @update:model-value="handleSelectChange"
          :items="selectOptions"
          :placeholder="metric.fieldConfig?.placeholder || '请选择'"
          class="rounded-xl"
          :class="inputStateClass"
          clearable
        />
      </template>

      <!-- 多选 -->
      <template v-else-if="metric.fieldType === 'multiselect'">
        <USelectMenu
          :model-value="modelValue || []"
          @update:model-value="handleValueChange"
          :items="selectOptions"
          multiple
          :placeholder="metric.fieldConfig?.placeholder || '请选择'"
          class="rounded-xl"
          :class="inputStateClass"
        />
      </template>

      <!-- 日期 -->
      <template v-else-if="metric.fieldType === 'date'">
        <UInput
          :model-value="modelValue"
          @update:model-value="handleValueChange"
          type="date"
          class="rounded-xl"
          :class="inputStateClass"
        />
      </template>

      <!-- 是/否 -->
      <template v-else-if="metric.fieldType === 'boolean'">
        <div class="flex items-center gap-4">
          <URadio
            :model-value="modelValue"
            @update:model-value="handleValueChange('yes')"
            value="yes"
            label="是"
          />
          <URadio
            :model-value="modelValue"
            @update:model-value="handleValueChange('no')"
            value="no"
            label="否"
          />
        </div>
      </template>

      <!-- 文件上传 -->
      <template v-else-if="metric.fieldType === 'file'">
        <div class="space-y-2">
          <UButton color="neutral" variant="outline" size="sm" @click="openFileUpload">
            <UIcon name="i-heroicons-arrow-up-tray" class="mr-2" />
            上传文件
          </UButton>
          <div v-if="modelValue" class="text-sm text-emerald-600 dark:text-emerald-400">
            已上传: {{ typeof modelValue === "string" ? modelValue : "文件" }}
          </div>
        </div>
      </template>

      <!-- 默认文本输入 -->
      <template v-else>
        <UInput
          :model-value="modelValue"
          @update:model-value="handleValueChange"
          @blur="handleBlur"
          :placeholder="metric.fieldConfig?.placeholder || '请输入'"
          class="rounded-xl"
          :class="inputStateClass"
        />
      </template>
    </UFormField>

    <!-- 合规警告提示 -->
    <div
      v-if="complianceState?.status === 'warning' && complianceState.messages.length > 0"
      class="mt-1 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
    >
      <div class="flex items-start gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-amber-500 mt-0.5 shrink-0" />
        <div class="text-sm">
          <p
            v-for="(msg, idx) in complianceState.messages"
            :key="idx"
            class="text-amber-700 dark:text-amber-300"
          >
            {{ msg }}
          </p>
          <p
            v-for="(sug, idx) in complianceState.suggestions"
            :key="'sug-' + idx"
            class="text-amber-600 dark:text-amber-400 mt-1 text-xs"
          >
            💡 {{ sug }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { MetricComplianceState } from "~/composables/useComplianceCheck"

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

  const props = defineProps<{
    metric: Metric
    modelValue: any
    error?: string
    complianceState?: MetricComplianceState
    enableRealtimeCheck?: boolean
  }>()

  const emit = defineEmits<{
    (e: "update:modelValue", value: any): void
    (e: "compliance-check", metricCode: string, value: any): void
  }>()

  // 生成标签
  const label = computed(() => {
    const code = props.metric.code.split(".").pop() || ""
    return `${code} ${props.metric.name}${props.metric.required ? " *" : ""}`
  })

  // 选项列表
  const selectOptions = computed(() => {
    return (
      props.metric.fieldConfig?.options?.map((opt) => ({
        label: opt.label,
        value: opt.value || null
      })) || []
    )
  })

  // 合规错误信息
  const complianceError = computed(() => {
    if (props.complianceState?.status === "error" && props.complianceState.messages.length > 0) {
      return props.complianceState.messages[0]
    }
    return undefined
  })

  // 输入框状态样式
  const inputStateClass = computed(() => {
    if (!props.complianceState) return ""
    switch (props.complianceState.status) {
      case "error":
        return "border-red-500 focus:border-red-500"
      case "warning":
        return "border-amber-500 focus:border-amber-500"
      case "pass":
        return "border-green-500 focus:border-green-500"
      default:
        return ""
    }
  })

  // 处理值变化
  const handleValueChange = (value: any) => {
    emit("update:modelValue", value)
  }

  // 处理选择变化
  const handleSelectChange = (value: any) => {
    emit("update:modelValue", value || null)
    // 选择后触发检查
    if (props.enableRealtimeCheck) {
      emit("compliance-check", props.metric.code, value)
    }
  }

  // 处理失焦事件（触发实时合规检查）
  const handleBlur = () => {
    if (
      props.enableRealtimeCheck &&
      props.modelValue !== null &&
      props.modelValue !== undefined &&
      props.modelValue !== ""
    ) {
      emit("compliance-check", props.metric.code, props.modelValue)
    }
  }

  // 打开文件上传
  const openFileUpload = () => {
    // TODO: 实现文件上传弹窗
  }
</script>
