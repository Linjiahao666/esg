<script setup lang="ts">
  definePageMeta({
    layout: "default"
  })

  const toast = useToast()

  // 数据源选项
  const dataSourceOptions = [
    { value: "employees", label: "员工数据" },
    { value: "energy_consumption", label: "能源消耗" },
    { value: "suppliers", label: "供应商" },
    { value: "training_records", label: "培训记录" },
    { value: "safety_incidents", label: "安全事故" },
    { value: "donations", label: "社会捐赠" },
    { value: "waste_data", label: "废物数据" },
    { value: "carbon_emissions", label: "碳排放" }
  ]

  // 来源系统选项
  const sourceSystemOptions = [
    { value: "", label: "通用" },
    { value: "SAP", label: "SAP" },
    { value: "用友", label: "用友 NC/U8" },
    { value: "金蝶", label: "金蝶 EAS/K3" },
    { value: "Oracle", label: "Oracle ERP" },
    { value: "Workday", label: "Workday" },
    { value: "其他", label: "其他系统" }
  ]

  // 筛选条件
  const filterDataSource = ref<string>("")

  // 获取映射模板列表
  const {
    data: templates,
    refresh: refreshTemplates,
    status
  } = await useFetch("/api/field-mappings", {
    query: computed(() => (filterDataSource.value ? { dataSource: filterDataSource.value } : {}))
  })

  // 编辑模态框
  const showEditModal = ref(false)
  const editingTemplate = ref<any>(null)
  const editForm = ref({
    name: "",
    dataSource: "employees",
    sourceSystem: "",
    description: "",
    mappings: {} as Record<string, string>,
    valueTransforms: {} as Record<string, Record<string, string>>,
    isDefault: false
  })

  // 目标字段定义
  const { data: fieldDefs } = await useFetch("/api/field-mappings/smart-match", {
    method: "POST",
    body: { sourceFields: [], dataSource: "employees" },
    immediate: false,
    key: "field-defs"
  })

  // 获取目标字段
  async function fetchTargetFields(dataSource: string) {
    const res = await $fetch("/api/field-mappings/smart-match", {
      method: "POST",
      body: { sourceFields: [], dataSource }
    })
    return (res as any).targetFields || []
  }

  // 当前编辑的目标字段列表
  const currentTargetFields = ref<{ key: string; label: string; required?: boolean }[]>([])

  // 监听数据源变化
  watch(
    () => editForm.value.dataSource,
    async (newVal) => {
      if (newVal) {
        currentTargetFields.value = await fetchTargetFields(newVal)
      }
    }
  )

  // 打开新建模态框
  async function openCreateModal() {
    editingTemplate.value = null
    editForm.value = {
      name: "",
      dataSource: "employees",
      sourceSystem: "",
      description: "",
      mappings: {},
      valueTransforms: {},
      isDefault: false
    }
    currentTargetFields.value = await fetchTargetFields("employees")
    showEditModal.value = true
  }

  // 打开编辑模态框
  async function openEditModal(template: any) {
    editingTemplate.value = template
    editForm.value = {
      name: template.name,
      dataSource: template.dataSource,
      sourceSystem: template.sourceSystem || "",
      description: template.description || "",
      mappings: { ...template.mappings },
      valueTransforms: { ...template.valueTransforms },
      isDefault: template.isDefault
    }
    currentTargetFields.value = await fetchTargetFields(template.dataSource)
    showEditModal.value = true
  }

  // 保存模板
  async function saveTemplate() {
    if (!editForm.value.name || !editForm.value.dataSource) {
      toast.add({ title: "请填写必填字段", color: "error" })
      return
    }

    try {
      await $fetch("/api/field-mappings", {
        method: "POST",
        body: {
          id: editingTemplate.value?.id,
          ...editForm.value
        }
      })
      toast.add({ title: "保存成功", color: "success" })
      showEditModal.value = false
      refreshTemplates()
    } catch (e: any) {
      toast.add({ title: "保存失败", description: e.message, color: "error" })
    }
  }

  // 删除模板
  async function deleteTemplate(template: any) {
    if (!confirm(`确定要删除映射模板 "${template.name}" 吗？`)) return

    try {
      await $fetch(`/api/field-mappings/${template.id}`, { method: "DELETE" })
      toast.add({ title: "删除成功", color: "success" })
      refreshTemplates()
    } catch (e: any) {
      toast.add({ title: "删除失败", description: e.message, color: "error" })
    }
  }

  // 复制模板
  function duplicateTemplate(template: any) {
    editingTemplate.value = null
    editForm.value = {
      name: `${template.name} (副本)`,
      dataSource: template.dataSource,
      sourceSystem: template.sourceSystem || "",
      description: template.description || "",
      mappings: { ...template.mappings },
      valueTransforms: { ...template.valueTransforms },
      isDefault: false
    }
    showEditModal.value = true
  }

  // 映射编辑器相关
  const newMappingSource = ref("")
  const newMappingTarget = ref("")

  function addMapping() {
    if (newMappingSource.value && newMappingTarget.value) {
      editForm.value.mappings[newMappingSource.value] = newMappingTarget.value
      newMappingSource.value = ""
      newMappingTarget.value = ""
    }
  }

  function removeMapping(sourceField: string) {
    delete editForm.value.mappings[sourceField]
  }

  // 表格列定义
  const columns = [
    { id: "name", header: "模板名称", accessorKey: "name" },
    { id: "dataSource", header: "数据源", accessorKey: "dataSource" },
    { id: "sourceSystem", header: "来源系统", accessorKey: "sourceSystem" },
    { id: "usageCount", header: "使用次数", accessorKey: "usageCount" },
    { id: "isDefault", header: "默认", accessorKey: "isDefault" },
    { id: "actions", header: "操作" }
  ]

  function getDataSourceLabel(value: string) {
    return dataSourceOptions.find((o) => o.value === value)?.label || value
  }
</script>

<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <NuxtLink to="/" class="hover:text-primary">首页</NuxtLink>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
        <span>字段映射管理</span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">字段映射模板</h1>
          <p class="text-gray-500 mt-1">
            管理不同来源系统的字段映射规则，支持自动识别企业系统导出的数据
          </p>
        </div>
        <UButton icon="i-heroicons-plus" @click="openCreateModal"> 新建模板 </UButton>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="mb-4">
      <USelect
        v-model="filterDataSource"
        :items="[{ value: '', label: '全部数据源' }, ...dataSourceOptions]"
        placeholder="筛选数据源"
        class="w-48"
      />
    </div>

    <!-- 模板列表 -->
    <UCard>
      <UTable :data="templates || []" :columns="columns" :loading="status === 'pending'">
        <template #dataSource-cell="{ row }">
          <UBadge color="primary" variant="subtle">
            {{ getDataSourceLabel(row.original.dataSource) }}
          </UBadge>
        </template>

        <template #sourceSystem-cell="{ row }">
          <span v-if="row.original.sourceSystem">{{ row.original.sourceSystem }}</span>
          <span v-else class="text-gray-400">通用</span>
        </template>

        <template #isDefault-cell="{ row }">
          <UIcon
            v-if="row.original.isDefault"
            name="i-heroicons-check-circle-solid"
            class="w-5 h-5 text-green-500"
          />
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              icon="i-heroicons-pencil"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="openEditModal(row.original)"
            />
            <UButton
              icon="i-heroicons-document-duplicate"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="duplicateTemplate(row.original)"
            />
            <UButton
              icon="i-heroicons-trash"
              size="xs"
              color="error"
              variant="ghost"
              @click="deleteTemplate(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div v-if="!templates?.length && status !== 'pending'" class="text-center py-8 text-gray-500">
        暂无映射模板，点击"新建模板"创建第一个模板
      </div>
    </UCard>

    <!-- 编辑模态框 -->
    <UModal v-model:open="showEditModal">
      <template #default>
        <div />
      </template>

      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingTemplate ? "编辑映射模板" : "新建映射模板" }}
          </h3>

          <div class="space-y-4">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="模板名称" required>
                <UInput v-model="editForm.name" placeholder="例如：SAP HR员工导出" />
              </UFormField>
              <UFormField label="数据源" required>
                <USelect v-model="editForm.dataSource" :items="dataSourceOptions" />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="来源系统">
                <USelect v-model="editForm.sourceSystem" :items="sourceSystemOptions" />
              </UFormField>
              <UFormField label="设为默认">
                <UCheckbox v-model="editForm.isDefault" label="该数据源的默认映射模板" />
              </UFormField>
            </div>

            <UFormField label="描述">
              <UTextarea
                v-model="editForm.description"
                placeholder="描述该映射模板的用途"
                rows="2"
              />
            </UFormField>

            <!-- 字段映射编辑器 -->
            <div class="border rounded-lg p-4">
              <h4 class="font-medium mb-3">字段映射规则</h4>
              <p class="text-sm text-gray-500 mb-3">
                定义源文件字段（左）与系统字段（右）的对应关系
              </p>

              <!-- 已有映射列表 -->
              <div v-if="Object.keys(editForm.mappings).length" class="space-y-2 mb-4">
                <div
                  v-for="(target, source) in editForm.mappings"
                  :key="source"
                  class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded"
                >
                  <span class="flex-1 font-mono text-sm">{{ source }}</span>
                  <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-400" />
                  <span class="flex-1 text-sm">
                    {{ currentTargetFields.find((f) => f.key === target)?.label || target }}
                  </span>
                  <UButton
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="removeMapping(source as string)"
                  />
                </div>
              </div>

              <!-- 添加新映射 -->
              <div class="flex items-center gap-2">
                <UInput
                  v-model="newMappingSource"
                  placeholder="源字段名（如：员工编号）"
                  class="flex-1"
                />
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-400 shrink-0" />
                <USelect
                  v-model="newMappingTarget"
                  :items="
                    currentTargetFields.map((f) => ({
                      value: f.key,
                      label: `${f.label}${f.required ? ' *' : ''}`
                    }))
                  "
                  placeholder="选择目标字段"
                  class="flex-1"
                />
                <UButton
                  icon="i-heroicons-plus"
                  color="primary"
                  variant="soft"
                  :disabled="!newMappingSource || !newMappingTarget"
                  @click="addMapping"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <UButton color="neutral" variant="ghost" @click="showEditModal = false"> 取消 </UButton>
            <UButton color="primary" @click="saveTemplate"> 保存 </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
