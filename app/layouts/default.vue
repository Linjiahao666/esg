<template>
  <div
    class="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-slate-950"
  >
    <!-- 顶部导航 -->
    <header
      class="border-b border-emerald-200 dark:border-emerald-800 h-16 px-6 flex justify-between items-center bg-white/80 dark:bg-emerald-900/80 backdrop-blur-sm sticky top-0 z-50"
    >
      <div class="flex items-center gap-4">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-bars-3"
          class="md:hidden"
          @click="sidebarOpen = !sidebarOpen"
        />
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-globe-alt" class="text-white text-xl" />
          </div>
          <div>
            <h1 class="text-lg font-semibold text-emerald-800 dark:text-emerald-100">
              ESG Dashboard
            </h1>
            <p class="text-xs text-emerald-600 dark:text-emerald-400">可持续发展管理平台</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- 主题切换按钮 -->
        <UButton
          color="neutral"
          variant="ghost"
          :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          @click="toggleColorMode"
        />
        <UButton color="neutral" variant="ghost" icon="i-heroicons-bell" class="relative">
          <span class="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
        </UButton>
        <!-- 用户菜单 -->
        <UDropdownMenu :items="userMenuItems">
          <UButton color="neutral" variant="ghost" icon="i-heroicons-user-circle" />
        </UDropdownMenu>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏 -->
      <aside
        :class="[
          'w-64 border-r border-emerald-200 dark:border-emerald-800 bg-white/60 dark:bg-emerald-900/60 backdrop-blur-sm flex-shrink-0 transition-transform duration-300 ease-out',
          'fixed md:static inset-y-0 left-0 z-40 pt-16 md:pt-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        ]"
      >
        <nav class="p-4 space-y-1">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer"
            :class="
              $route.path === item.path
                ? `bg-gradient-to-r ${item.gradient} text-white font-medium shadow-lg shadow-emerald-500/20`
                : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800/50'
            "
            @click="sidebarOpen = false"
          >
            <UIcon :name="item.icon" class="text-lg" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <!-- 侧边栏底部信息 -->
        <div
          class="absolute bottom-0 left-0 right-0 p-4 border-t border-emerald-200 dark:border-emerald-800"
        >
          <div class="text-xs text-emerald-600 dark:text-emerald-400 text-center">
            <p>ESG 评分</p>
            <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">A+</p>
          </div>
        </div>
      </aside>

      <!-- 遮罩层 (移动端) -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-emerald-900/50 backdrop-blur-sm z-30 md:hidden"
        @click="sidebarOpen = false"
      />

      <!-- 主体内容 -->
      <main class="flex-1 overflow-auto p-6">
        <div class="max-w-7xl mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
  const sidebarOpen = ref(false)
  const colorMode = useColorMode()
  const { user, isAuthenticated, logout, fetchUser, roleLabel, hasRole, hasPermission, ROLES } =
    useAuth()

  // 获取用户信息
  onMounted(() => {
    fetchUser()
  })

  const toggleColorMode = () => {
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark"
  }

  // 用户下拉菜单
  const userMenuItems = computed(() => {
    if (isAuthenticated.value) {
      return [
        [
          {
            label: `${user.value?.name || "用户"} (${roleLabel.value})`,
            slot: "account",
            disabled: true
          }
        ],
        [
          {
            label: "个人设置",
            icon: "i-heroicons-cog-6-tooth",
            onSelect: () => navigateTo("/settings")
          },
          {
            label: "文件管理",
            icon: "i-heroicons-folder",
            onSelect: () => navigateTo("/files")
          }
        ],
        [
          {
            label: "退出登录",
            icon: "i-heroicons-arrow-right-on-rectangle",
            onSelect: () => logout()
          }
        ]
      ]
    }
    return [
      [
        {
          label: "登录",
          icon: "i-heroicons-arrow-left-on-rectangle",
          onSelect: () => navigateTo("/login")
        },
        {
          label: "注册",
          icon: "i-heroicons-user-plus",
          onSelect: () => navigateTo("/register")
        }
      ]
    ]
  })

  // 菜单项定义（根据角色显示/隐藏）
  // 统一使用 Emerald 绿色系渐变，保持视觉一致性
  const allMenuItems = [
    {
      path: "/",
      label: "首页",
      icon: "i-heroicons-home",
      gradient: "from-emerald-500 to-emerald-600",
      roles: null // 所有人可见
    },
    {
      path: "/data-sources",
      label: "数据源管理",
      icon: "i-heroicons-circle-stack",
      gradient: "from-emerald-500 to-teal-500",
      roles: [ROLES.ADMIN, ROLES.ENTRY] // 仅录入者和管理员
    },
    {
      path: "/standards",
      label: "国际标准",
      icon: "i-heroicons-clipboard-document-list",
      gradient: "from-blue-500 to-indigo-500",
      roles: [ROLES.ADMIN, ROLES.AUDITOR] // 管理员和审计者
    },
    {
      path: "/esg/calculate",
      label: "指标计算",
      icon: "i-heroicons-calculator",
      gradient: "from-teal-500 to-emerald-500",
      roles: [ROLES.ADMIN, ROLES.AUDITOR] // 仅审计者和管理员
    },
    {
      path: "/esg/report",
      label: "ESG 报告",
      icon: "i-heroicons-document-chart-bar",
      gradient: "from-emerald-500 to-green-500",
      roles: null // 所有人可见
    },
    {
      path: "/reports",
      label: "报告中心",
      icon: "i-heroicons-document-text",
      gradient: "from-green-500 to-teal-500",
      roles: [ROLES.ADMIN, ROLES.AUDITOR, ROLES.ENTRY] // 登录用户可见
    },
    {
      path: "/esg/environment",
      label: "环境指标",
      icon: "i-heroicons-globe-alt",
      gradient: "from-emerald-500 to-green-500",
      roles: null // 所有人可见
    },
    {
      path: "/esg/social",
      label: "社会责任",
      icon: "i-heroicons-user-group",
      gradient: "from-teal-500 to-green-500",
      roles: null // 所有人可见
    },
    {
      path: "/esg/governance",
      label: "公司治理",
      icon: "i-heroicons-building-office",
      gradient: "from-green-500 to-emerald-500",
      roles: null // 所有人可见
    },
    {
      path: "/admin/users",
      label: "用户管理",
      icon: "i-heroicons-users",
      gradient: "from-emerald-600 to-emerald-500",
      roles: [ROLES.ADMIN] // 仅管理员
    }
  ]

  // 根据用户角色过滤菜单项
  const menuItems = computed(() => {
    return allMenuItems.filter((item) => {
      if (!item.roles) return true // null 表示所有人可见
      if (!user.value?.role) return false
      return hasRole(item.roles as any)
    })
  })
</script>
