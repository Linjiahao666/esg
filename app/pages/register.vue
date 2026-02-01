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

        <h2 class="text-4xl font-bold mb-6 leading-tight">加入我们<br />共创绿色未来</h2>

        <p class="text-lg text-emerald-100 mb-8 max-w-md">
          注册成为 ESG Dashboard 用户，开始您的可持续发展之旅，让数据驱动企业的环境与社会责任。
        </p>

        <!-- 特性列表 -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UIcon name="i-heroicons-user-plus" class="text-xl" />
            </div>
            <span>快速注册，即刻开始</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UIcon name="i-heroicons-lock-closed" class="text-xl" />
            </div>
            <span>数据安全，隐私保护</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UIcon name="i-heroicons-sparkles" class="text-xl" />
            </div>
            <span>智能分析，洞察趋势</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧注册表单 -->
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

        <!-- 注册卡片 -->
        <UCard class="shadow-xl shadow-emerald-500/10">
          <div class="p-2">
            <h2 class="text-2xl font-bold text-emerald-800 dark:text-emerald-100 mb-2">创建账户</h2>
            <p class="text-emerald-600 dark:text-emerald-400 mb-8">注册以开始使用 ESG 管理平台</p>

            <form @submit.prevent="handleRegister" class="space-y-5">
              <!-- 姓名 -->
              <UFormField label="姓名" name="name" :error="errors.name">
                <UInput
                  v-model="form.name"
                  type="text"
                  placeholder="您的姓名"
                  icon="i-heroicons-user"
                  size="lg"
                  class="rounded-xl"
                />
              </UFormField>

              <!-- 邮箱 -->
              <UFormField label="邮箱地址" name="email" :error="errors.email">
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
              <UFormField label="密码" name="password" :error="errors.password">
                <UInput
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="至少6位密码"
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

              <!-- 确认密码 -->
              <UFormField label="确认密码" name="confirmPassword" :error="errors.confirmPassword">
                <UInput
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="再次输入密码"
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
                      :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      @click="showConfirmPassword = !showConfirmPassword"
                    />
                  </template>
                </UInput>
              </UFormField>

              <!-- 同意条款 -->
              <UCheckbox v-model="form.agreeTerms">
                <template #label>
                  <span class="text-sm text-emerald-600 dark:text-emerald-400">
                    我已阅读并同意
                    <NuxtLink to="#" class="text-emerald-700 dark:text-emerald-300 hover:underline">
                      服务条款
                    </NuxtLink>
                    和
                    <NuxtLink to="#" class="text-emerald-700 dark:text-emerald-300 hover:underline">
                      隐私政策
                    </NuxtLink>
                  </span>
                </template>
              </UCheckbox>

              <!-- 注册按钮 -->
              <UButton
                type="submit"
                block
                size="lg"
                color="primary"
                class="rounded-xl"
                :loading="loading"
                :disabled="!form.agreeTerms"
              >
                <UIcon name="i-heroicons-user-plus" class="mr-2" />
                注册
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

            <!-- 登录链接 -->
            <p class="mt-8 text-center text-sm text-emerald-600 dark:text-emerald-400">
              已有账户？
              <NuxtLink
                to="/login"
                class="font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
              >
                立即登录
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
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  })

  const errors = ref({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const showPassword = ref(false)
  const showConfirmPassword = ref(false)
  const loading = ref(false)

  const toggleColorMode = () => {
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark"
  }

  const validateForm = () => {
    let isValid = true
    errors.value = { name: "", email: "", password: "", confirmPassword: "" }

    // 验证姓名
    if (!form.value.name.trim()) {
      errors.value.name = "请输入姓名"
      isValid = false
    }

    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.value.email) {
      errors.value.email = "请输入邮箱"
      isValid = false
    } else if (!emailRegex.test(form.value.email)) {
      errors.value.email = "请输入有效的邮箱地址"
      isValid = false
    }

    // 验证密码
    if (!form.value.password) {
      errors.value.password = "请输入密码"
      isValid = false
    } else if (form.value.password.length < 6) {
      errors.value.password = "密码长度至少为6位"
      isValid = false
    }

    // 验证确认密码
    if (!form.value.confirmPassword) {
      errors.value.confirmPassword = "请确认密码"
      isValid = false
    } else if (form.value.password !== form.value.confirmPassword) {
      errors.value.confirmPassword = "两次输入的密码不一致"
      isValid = false
    }

    return isValid
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    loading.value = true

    try {
      const { data, error } = await useFetch("/api/auth/register", {
        method: "POST",
        body: {
          email: form.value.email,
          password: form.value.password,
          name: form.value.name
        }
      })

      if (error.value) {
        toast.add({
          title: "注册失败",
          description: error.value.data?.message || "请稍后重试",
          color: "error"
        })
        return
      }

      toast.add({
        title: "注册成功",
        description: "欢迎加入 ESG Dashboard！",
        color: "success"
      })

      // 注册成功后跳转到首页
      router.push("/")
    } catch (e: any) {
      toast.add({
        title: "注册失败",
        description: e.message || "请稍后重试",
        color: "error"
      })
    } finally {
      loading.value = false
    }
  }
</script>
