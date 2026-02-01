<template>
  <div
    class="min-h-screen flex bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-slate-950"
  >
    <!-- 左侧品牌区域 -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500"></div>
      <div
        class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"
      ></div>

      <!-- 品牌内容 -->
      <div class="relative z-10 flex flex-col justify-center p-12 text-white">
        <div class="flex items-center gap-4 mb-8">
          <div
            class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <UIcon name="i-heroicons-globe-alt" class="text-4xl" />
          </div>
          <div>
            <h1 class="text-3xl font-bold">ESG Dashboard</h1>
            <p class="text-emerald-100">可持续发展管理平台</p>
          </div>
        </div>

        <h2 class="text-4xl font-bold mb-6 leading-tight">构建可持续发展<br />企业的未来</h2>

        <p class="text-lg text-emerald-100 mb-8 max-w-md">
          通过全面的 ESG 数据管理和分析，帮助企业实现环境、社会和治理目标，创造长期价值。
        </p>

        <!-- 特性列表 -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UIcon name="i-heroicons-chart-bar" class="text-xl" />
            </div>
            <span>实时数据监控与可视化分析</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UIcon name="i-heroicons-document-check" class="text-xl" />
            </div>
            <span>符合国际 ESG 报告标准</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UIcon name="i-heroicons-shield-check" class="text-xl" />
            </div>
            <span>企业级安全与合规保障</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="flex-1 flex items-center justify-center p-6 lg:p-12">
      <div class="w-full max-w-md">
        <!-- 移动端 Logo -->
        <div class="lg:hidden flex items-center gap-3 mb-8">
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-globe-alt" class="text-white text-2xl" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-emerald-800 dark:text-emerald-100">ESG Dashboard</h1>
            <p class="text-xs text-emerald-600 dark:text-emerald-400">可持续发展管理平台</p>
          </div>
        </div>

        <!-- 主题切换 -->
        <div class="flex justify-end mb-6">
          <UButton
            color="neutral"
            variant="ghost"
            :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
            @click="toggleColorMode"
          />
        </div>

        <!-- 登录卡片 -->
        <UCard class="shadow-xl shadow-emerald-500/10">
          <div class="p-2">
            <h2 class="text-2xl font-bold text-emerald-800 dark:text-emerald-100 mb-2">欢迎回来</h2>
            <p class="text-emerald-600 dark:text-emerald-400 mb-8">
              登录您的账户以访问 ESG 管理平台
            </p>

            <form @submit.prevent="handleLogin" class="space-y-6">
              <!-- 邮箱 -->
              <UFormField label="邮箱地址" name="email">
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="your@email.com"
                  icon="i-heroicons-envelope"
                  size="lg"
                  class="rounded-xl"
                />
              </UFormField>

              <!-- 密码 -->
              <UFormField label="密码" name="password">
                <UInput
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="输入您的密码"
                  icon="i-heroicons-lock-closed"
                  size="lg"
                  class="rounded-xl"
                  :ui="{ trailing: 'pr-12' }"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </UInput>
              </UFormField>

              <!-- 记住我 & 忘记密码 -->
              <div class="flex items-center justify-between">
                <UCheckbox v-model="form.remember" label="记住我" />
                <NuxtLink
                  to="#"
                  class="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  忘记密码？
                </NuxtLink>
              </div>

              <!-- 登录按钮 -->
              <UButton
                type="submit"
                block
                size="lg"
                color="primary"
                class="rounded-xl"
                :loading="loading"
              >
                <UIcon name="i-heroicons-arrow-right-on-rectangle" class="mr-2" />
                登录
              </UButton>
            </form>

            <!-- 分隔线 -->
            <div class="relative my-8">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-emerald-200 dark:border-emerald-700"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white dark:bg-emerald-900 text-emerald-500">或</span>
              </div>
            </div>

            <!-- 第三方登录 -->
            <div class="grid grid-cols-2 gap-4">
              <UButton color="neutral" variant="outline" size="lg" class="rounded-xl">
                <UIcon name="i-simple-icons-microsoft" class="mr-2" />
                Microsoft
              </UButton>
              <UButton color="neutral" variant="outline" size="lg" class="rounded-xl">
                <UIcon name="i-simple-icons-google" class="mr-2" />
                Google
              </UButton>
            </div>

            <!-- 注册链接 -->
            <p class="mt-8 text-center text-sm text-emerald-600 dark:text-emerald-400">
              还没有账户？
              <NuxtLink
                to="/register"
                class="font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
              >
                立即注册
              </NuxtLink>
            </p>
          </div>
        </UCard>

        <!-- 底部版权 -->
        <p class="mt-8 text-center text-xs text-emerald-500 dark:text-emerald-500">
          © 2026 ESG Dashboard. 保留所有权利。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    layout: false
  })

  const colorMode = useColorMode()
  const router = useRouter()
  const toast = useToast()

  const form = ref({
    email: "",
    password: "",
    remember: false
  })

  const showPassword = ref(false)
  const loading = ref(false)

  const toggleColorMode = () => {
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark"
  }

  const handleLogin = async () => {
    // 基本验证
    if (!form.value.email || !form.value.password) {
      toast.add({
        title: "请输入邮箱和密码",
        color: "warning"
      })
      return
    }

    loading.value = true

    try {
      const { data, error } = await useFetch("/api/auth/login", {
        method: "POST",
        body: {
          email: form.value.email,
          password: form.value.password,
          remember: form.value.remember
        }
      })

      if (error.value) {
        toast.add({
          title: "登录失败",
          description: error.value.data?.message || "邮箱或密码错误",
          color: "error"
        })
        return
      }

      toast.add({
        title: "登录成功",
        description: `欢迎回来，${data.value?.user?.name}！`,
        color: "success"
      })

      // 登录成功后跳转到首页
      router.push("/")
    } catch (e: any) {
      toast.add({
        title: "登录失败",
        description: e.message || "请稍后重试",
        color: "error"
      })
    } finally {
      loading.value = false
    }
  }
</script>
