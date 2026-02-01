import type { User } from '~~/server/database/schema'

// 用户类型（不含密码）
type SafeUser = Omit<User, 'password'>

// 角色常量（与服务端保持一致）
export const ROLES = {
  ADMIN: 'admin',     // 管理员 - 完全控制权限
  AUDITOR: 'auditor', // 审计者 - 审核数据、查看报告
  ENTRY: 'entry',     // 录入者 - 录入和提交数据
  VIEWER: 'viewer'    // 查看者 - 只读访问
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// 角色权限矩阵
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['view', 'create', 'edit', 'submit', 'approve', 'reject', 'export', 'calculate', 'manage_users'],
  [ROLES.AUDITOR]: ['view', 'approve', 'reject', 'export', 'calculate'],
  [ROLES.ENTRY]: ['view', 'create', 'edit', 'submit'],
  [ROLES.VIEWER]: ['view', 'export']
} as const

export type Permission = 'view' | 'create' | 'edit' | 'submit' | 'approve' | 'reject' | 'export' | 'calculate' | 'manage_users'

// 角色显示名称
export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLES.ADMIN]: '系统管理员',
  [ROLES.AUDITOR]: '审计者',
  [ROLES.ENTRY]: '录入者',
  [ROLES.VIEWER]: '查看者'
}

export const useAuth = () => {
  const user = useState<SafeUser | null>('auth-user', () => null)
  const isAuthenticated = computed(() => !!user.value)

  // 角色检查计算属性
  const isAdmin = computed(() => user.value?.role === ROLES.ADMIN)
  const isAuditor = computed(() => user.value?.role === ROLES.AUDITOR)
  const isEntry = computed(() => user.value?.role === ROLES.ENTRY)
  const isViewer = computed(() => user.value?.role === ROLES.VIEWER)

  // 角色显示名称
  const roleLabel = computed(() => {
    if (!user.value?.role) return ''
    return ROLE_LABELS[user.value.role as UserRole] || user.value.role
  })

  // 检查用户是否有特定角色
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user.value?.role) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.value.role as UserRole)
  }

  // 检查用户是否有特定权限
  const hasPermission = (permission: Permission): boolean => {
    if (!user.value?.role) return false
    const userPermissions = ROLE_PERMISSIONS[user.value.role as UserRole] || []
    return userPermissions.includes(permission)
  }

  // 快捷权限检查
  const canView = computed(() => hasPermission('view'))
  const canCreate = computed(() => hasPermission('create'))
  const canEdit = computed(() => hasPermission('edit'))
  const canSubmit = computed(() => hasPermission('submit'))
  const canApprove = computed(() => hasPermission('approve'))
  const canReject = computed(() => hasPermission('reject'))
  const canExport = computed(() => hasPermission('export'))
  const canCalculate = computed(() => hasPermission('calculate'))
  const canManageUsers = computed(() => hasPermission('manage_users'))

  // 获取当前用户信息
  const fetchUser = async () => {
    try {
      const { data } = await useFetch('/api/auth/me')
      if (data.value?.success) {
        user.value = data.value.user as SafeUser
      }
    } catch {
      user.value = null
    }
    return user.value
  }

  // 登录
  const login = async (email: string, password: string, remember = false) => {
    const { data, error } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password, remember }
    })

    if (error.value) {
      throw new Error(error.value.data?.message || '登录失败')
    }

    user.value = data.value?.user as SafeUser
    return data.value
  }

  // 注册
  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: { email, password, name }
    })

    if (error.value) {
      throw new Error(error.value.data?.message || '注册失败')
    }

    user.value = data.value?.user as SafeUser
    return data.value
  }

  // 登出
  const logout = async () => {
    await useFetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    navigateTo('/login')
  }

  return {
    // 用户状态
    user,
    isAuthenticated,

    // 角色检查
    isAdmin,
    isAuditor,
    isEntry,
    isViewer,
    roleLabel,
    hasRole,

    // 权限检查
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canSubmit,
    canApprove,
    canReject,
    canExport,
    canCalculate,
    canManageUsers,

    // 操作
    fetchUser,
    login,
    register,
    logout,

    // 常量导出
    ROLES,
    ROLE_LABELS,
    ROLE_PERMISSIONS
  }
}
