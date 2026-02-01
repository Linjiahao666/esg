import type { UserRole, Permission } from '~/composables/useAuth'

declare module '#app' {
  interface PageMeta {
    /** 允许访问此页面的角色列表（满足任一即可） */
    roles?: UserRole[]
    /** 访问此页面需要的权限列表（满足任一即可） */
    permissions?: Permission[]
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    /** 允许访问此页面的角色列表（满足任一即可） */
    roles?: UserRole[]
    /** 访问此页面需要的权限列表（满足任一即可） */
    permissions?: Permission[]
  }
}

export { }
