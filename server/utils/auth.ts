import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { db, users, sessions, type User } from '../database'
import { ROLES, ROLE_PERMISSIONS, type UserRole, type Permission } from '../database/schema'
import { eq } from 'drizzle-orm'

// 导出角色常量供外部使用
export { ROLES, ROLE_PERMISSIONS, type UserRole, type Permission }

// JWT 密钥（生产环境应使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'esg-dashboard-secret-key-2026'
const JWT_EXPIRES_IN = '7d'

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 生成 JWT Token
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// 验证 JWT Token
export function verifyToken(token: string): { userId: number; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string }
  } catch {
    return null
  }
}

// 从请求中获取当前用户
export async function getCurrentUser(event: H3Event): Promise<User | null> {
  const token = getCookie(event, 'auth_token') || getHeader(event, 'Authorization')?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, decoded.userId)
  })

  return user || null
}

// 要求用户已登录的中间件辅助函数
export async function requireAuth(event: H3Event): Promise<User> {
  const user = await getCurrentUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '请先登录'
    })
  }

  return user
}

// 要求管理员权限
export async function requireAdmin(event: H3Event): Promise<User> {
  const user = await requireAuth(event)

  if (user.role !== ROLES.ADMIN) {
    throw createError({
      statusCode: 403,
      message: '权限不足，需要管理员权限'
    })
  }

  return user
}

// 要求特定角色
export async function requireRole(event: H3Event, allowedRoles: UserRole[]): Promise<User> {
  const user = await requireAuth(event)

  if (!allowedRoles.includes(user.role as UserRole)) {
    throw createError({
      statusCode: 403,
      message: `权限不足，需要以下角色之一: ${allowedRoles.join(', ')}`
    })
  }

  return user
}

// 要求特定权限
export async function requirePermission(event: H3Event, permission: Permission): Promise<User> {
  const user = await requireAuth(event)
  const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || []

  if (!userPermissions.includes(permission)) {
    throw createError({
      statusCode: 403,
      message: `权限不足，需要 ${permission} 权限`
    })
  }

  return user
}

// 要求录入者权限 (admin 或 entry)
export async function requireEntry(event: H3Event): Promise<User> {
  return requireRole(event, [ROLES.ADMIN, ROLES.ENTRY])
}

// 要求审计者权限 (admin 或 auditor)
export async function requireAuditor(event: H3Event): Promise<User> {
  return requireRole(event, [ROLES.ADMIN, ROLES.AUDITOR])
}

// 要求查看者权限 (所有角色都有)
export async function requireViewer(event: H3Event): Promise<User> {
  return requireRole(event, [ROLES.ADMIN, ROLES.AUDITOR, ROLES.ENTRY, ROLES.VIEWER])
}

// 检查用户是否有特定权限（不抛出错误，返回布尔值）
export function hasPermission(user: User, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || []
  return userPermissions.includes(permission)
}

// 检查用户是否有特定角色（不抛出错误，返回布尔值）
export function hasRole(user: User, roles: UserRole | UserRole[]): boolean {
  const roleArray = Array.isArray(roles) ? roles : [roles]
  return roleArray.includes(user.role as UserRole)
}

// 设置认证 Cookie
export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: '/'
  })
}

// 清除认证 Cookie
export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, 'auth_token', {
    path: '/'
  })
}

// 排除敏感字段
export function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...safeUser } = user
  return safeUser
}
