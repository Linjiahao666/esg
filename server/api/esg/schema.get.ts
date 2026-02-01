import { db, esgModules, esgSubModules, esgCategories, esgMetrics } from '../../database'
import { eq, asc } from 'drizzle-orm'

// 获取完整的 ESG 模块结构（用于导航和表单渲染）
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const moduleCode = query.module as string | undefined // E, S, G
  const subModuleCode = query.subModule as string | undefined // E1, S1, G1

  // 获取所有模块
  const modules = await db.query.esgModules.findMany({
    orderBy: [asc(esgModules.sortOrder)]
  })

  // 获取所有子模块
  let subModulesQuery = db.query.esgSubModules.findMany({
    orderBy: [asc(esgSubModules.sortOrder)]
  })

  const subModules = await subModulesQuery

  // 获取所有分类
  const categories = await db.query.esgCategories.findMany({
    orderBy: [asc(esgCategories.sortOrder)]
  })

  // 获取所有指标
  const metrics = await db.query.esgMetrics.findMany({
    orderBy: [asc(esgMetrics.sortOrder)]
  })

  // 构建树形结构
  const result = modules
    .filter((m) => !moduleCode || m.code === moduleCode)
    .map((module) => {
      const moduleSubModules = subModules.filter((s) => s.moduleId === module.id)

      return {
        ...module,
        subModules: moduleSubModules
          .filter((s) => !subModuleCode || s.code === subModuleCode)
          .map((subModule) => {
            const subModuleCategories = categories.filter((c) => c.subModuleId === subModule.id)

            // 找到最小 level 作为起始层级
            const minLevel = subModuleCategories.length > 0
              ? Math.min(...subModuleCategories.map(c => c.level ?? 2))
              : 2

            // 构建分类树 - 从实际最小层级开始
            const buildCategoryTree = (parentId: number | null): any[] => {
              return subModuleCategories
                .filter((c) => c.parentId === parentId)
                .map((category) => {
                  const categoryMetrics = metrics.filter((m) => m.categoryId === category.id)
                  const children = buildCategoryTree(category.id)

                  return {
                    ...category,
                    metrics: categoryMetrics.map((m) => ({
                      ...m,
                      fieldConfig: m.fieldConfig ? JSON.parse(m.fieldConfig) : null
                    })),
                    children: children.length > 0 ? children : undefined
                  }
                })
            }

            return {
              ...subModule,
              categories: buildCategoryTree(null)
            }
          })
      }
    })

  return {
    success: true,
    data: moduleCode ? result[0] : result
  }
})
