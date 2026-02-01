/**
 * 全局认证中间件
 * 
 * 保护需要登录的路由，未登录用户将被重定向到登录页
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // 公开路由列表（不需要登录）
  const publicRoutes = ['/login', '/register']

  // 如果是公开路由，直接放行
  if (publicRoutes.includes(to.path)) {
    return
  }

  // 获取当前用户
  const { user, fetchUser } = useAuth()

  // 如果用户信息为空，尝试从服务端获取
  if (!user.value) {
    await fetchUser()
  }

  // 如果仍然没有用户信息，重定向到登录页
  if (!user.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
