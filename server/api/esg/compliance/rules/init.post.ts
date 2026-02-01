/**
 * 初始化预置合规规则
 * POST /api/esg/compliance/rules/init
 */
import { requireAuth } from '../../../../utils/auth'
import { seedComplianceRules } from '../../../../database/seeds/compliance-rules'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // 检查用户权限（仅管理员可执行）
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '仅管理员可执行此操作',
    })
  }

  try {
    const result = await seedComplianceRules()

    return {
      success: true,
      message: `合规规则初始化完成: 新增 ${result.inserted} 条，跳过 ${result.skipped} 条（已存在）`,
      data: result,
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `初始化失败: ${error.message}`,
    })
  }
})
