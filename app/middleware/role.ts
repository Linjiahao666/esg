/**
 * 角色检查中间件
 * 
 * 检查用户是否有访问当前页面所需的角色/权限
 * 
 * 使用方式：在页面中使用 definePageMeta 声明所需角色
 * 
 * ```ts
 * definePageMeta({
 *   middleware: 'role',
 *   roles: ['admin', 'auditor'],          // 允许的角色（任一）
 *   // 或
 *   permissions: ['approve', 'reject'],   // 需要的权限（任一）
 * })
 * ```
 */

import { ROLE_PERMISSIONS, type UserRole, type Permission } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()

  // 获取页面元数据中定义的角色/权限要求
  const requiredRoles = to.meta.roles as UserRole[] | undefined
  const requiredPermissions = to.meta.permissions as Permission[] | undefined

  // 如果没有定义角色/权限要求，直接放行
  if (!requiredRoles && !requiredPermissions) {
    return
  }

  // 用户未登录
  if (!user.value) {
    return navigateTo('/login')
  }

  const userRole = user.value.role as UserRole
  const userPermissions = ROLE_PERMISSIONS[userRole] || [] as readonly Permission[]

  // 检查角色
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userRole)) {
      // 无权限访问，抛出 403 错误或重定向
      throw createError({
        statusCode: 403,
        statusMessage: '权限不足',
        message: `访问此页面需要以下角色之一: ${requiredRoles.join(', ')}`
      })
    }
  }

  // 检查权限
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAnyPermission = requiredPermissions.some(p => (userPermissions as readonly Permission[]).includes(p))
    if (!hasAnyPermission) {
      throw createError({
        statusCode: 403,
        statusMessage: '权限不足',
        message: `访问此页面需要以下权限之一: ${requiredPermissions.join(', ')}`
      })
    }
  }
})
