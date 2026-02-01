<script setup lang="ts">
  definePageMeta({
    layout: "default",
    middleware: ["role"],
    roles: ["admin"]
  })

  // 用户类型定义
  interface UserItem {
    id: number
    email: string
    name: string
    role: string
    avatar?: string
    createdAt: string | Date | null
    updatedAt: string | Date | null
  }

  const toast = useToast()
  const { ROLES, ROLE_LABELS } = useAuth()

  // 用户列表
  const { data: usersResponse, pending, refresh } = await useFetch("/api/admin/users")

  const userList = computed<UserItem[]>(() => {
    return (usersResponse.value as any)?.data || []
  })

  // 角色选项
  const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
    label,
    value
  }))

  // 角色颜色（使用 Nuxt UI 支持的颜色）
  const roleColors: Record<string, "error" | "info" | "success" | "neutral"> = {
    admin: "error",
    auditor: "info",
    entry: "success",
    viewer: "neutral"
  }

  // 编辑用户模态框
  const editModal = ref(false)
  const editForm = ref({
    userId: 0,
    name: "",
    role: "" as string
  })

  function openEditModal(user: UserItem) {
    editForm.value = {
      userId: user.id,
      name: user.name,
      role: user.role
    }
    editModal.value = true
  }

  async function saveUser() {
    try {
      await $fetch("/api/admin/users", {
        method: "PUT",
        body: editForm.value
      })

      toast.add({
        title: "保存成功",
        description: "用户信息已更新",
        color: "success"
      })

      editModal.value = false
      refresh()
    } catch (error: any) {
      toast.add({
        title: "保存失败",
        description: error.data?.message || "更新用户信息失败",
        color: "error"
      })
    }
  }

  // 创建用户模态框
  const createModal = ref(false)
  const createForm = ref({
    email: "",
    password: "",
    name: "",
    role: "viewer" as string
  })

  function openCreateModal() {
    createForm.value = {
      email: "",
      password: "",
      name: "",
      role: "viewer"
    }
    createModal.value = true
  }

  async function createUser() {
    try {
      await $fetch("/api/admin/users", {
        method: "POST",
        body: createForm.value
      })

      toast.add({
        title: "创建成功",
        description: "用户已创建",
        color: "success"
      })

      createModal.value = false
      refresh()
    } catch (error: any) {
      toast.add({
        title: "创建失败",
        description: error.data?.message || "创建用户失败",
        color: "error"
      })
    }
  }

  // 删除用户
  async function deleteUser(user: UserItem) {
    if (!confirm(`确定要删除用户 "${user.name}" 吗？此操作不可撤销。`)) {
      return
    }

    try {
      await $fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE"
      })

      toast.add({
        title: "删除成功",
        description: "用户已删除",
        color: "success"
      })

      refresh()
    } catch (error: any) {
      toast.add({
        title: "删除失败",
        description: error.data?.message || "删除用户失败",
        color: "error"
      })
    }
  }

  // 格式化日期
  function formatDate(date: string | Date | null) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("zh-CN")
  }
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-emerald-800 dark:text-emerald-100">用户管理</h1>
        <p class="text-sm text-emerald-600 dark:text-emerald-400 mt-1">管理系统用户和角色权限</p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" @click="openCreateModal"> 创建用户 </UButton>
    </div>

    <!-- 角色说明卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard v-for="(label, role) in ROLE_LABELS" :key="role" class="text-center">
        <div class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</div>
        <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          <template v-if="role === 'admin'">完全控制权限</template>
          <template v-else-if="role === 'auditor'">审核数据、计算指标</template>
          <template v-else-if="role === 'entry'">录入和提交数据</template>
          <template v-else>只读访问、导出数据</template>
        </div>
      </UCard>
    </div>

    <!-- 用户列表 -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">用户列表</span>
          <UBadge color="gray">{{ userList.length }} 位用户</UBadge>
        </div>
      </template>

      <div v-if="pending" class="text-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-emerald-500" />
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>

      <div v-else-if="userList.length === 0" class="text-center py-8 text-gray-500">暂无用户</div>

      <UTable
        v-else
        :data="userList"
        :columns="[
          { key: 'name', label: '姓名' },
          { key: 'email', label: '邮箱' },
          { key: 'role', label: '角色' },
          { key: 'createdAt', label: '创建时间' },
          { key: 'actions', label: '操作' }
        ]"
      >
        <template #role-cell="{ row }">
          <UBadge :color="roleColors[(row.original as UserItem).role] || 'neutral'" size="sm">
            {{
              ROLE_LABELS[(row.original as UserItem).role as keyof typeof ROLE_LABELS] ||
              (row.original as UserItem).role
            }}
          </UBadge>
        </template>

        <template #createdAt-cell="{ row }">
          {{ formatDate((row.original as UserItem).createdAt) }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-heroicons-pencil"
              @click="openEditModal(row.original as UserItem)"
            />
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="deleteUser(row.original as UserItem)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- 编辑用户模态框 -->
    <UModal v-model:open="editModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">编辑用户</span>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="editModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UFormField label="姓名">
              <UInput v-model="editForm.name" placeholder="请输入姓名" />
            </UFormField>

            <UFormField label="角色">
              <USelect v-model="editForm.role" :items="roleOptions" placeholder="请选择角色" />
            </UFormField>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="gray" variant="ghost" @click="editModal = false"> 取消 </UButton>
              <UButton color="primary" @click="saveUser"> 保存 </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- 创建用户模态框 -->
    <UModal v-model:open="createModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">创建用户</span>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="createModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UFormField label="邮箱" required>
              <UInput v-model="createForm.email" type="email" placeholder="请输入邮箱" />
            </UFormField>

            <UFormField label="密码" required>
              <UInput
                v-model="createForm.password"
                type="password"
                placeholder="请输入密码（至少6位）"
              />
            </UFormField>

            <UFormField label="姓名" required>
              <UInput v-model="createForm.name" placeholder="请输入姓名" />
            </UFormField>

            <UFormField label="角色" required>
              <USelect v-model="createForm.role" :items="roleOptions" placeholder="请选择角色" />
            </UFormField>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="gray" variant="ghost" @click="createModal = false"> 取消 </UButton>
              <UButton color="primary" @click="createUser"> 创建 </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
