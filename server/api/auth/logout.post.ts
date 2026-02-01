import { clearAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // 清除认证 cookie
  clearAuthCookie(event)

  return {
    success: true,
    message: '已退出登录'
  }
})
