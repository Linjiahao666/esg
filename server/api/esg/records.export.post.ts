import fs from "fs"
import path from "path"
import { db, esgRecords, esgMetrics, esgCategories, esgSubModules } from '../../database'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { requireViewer } from '../../utils/auth'

// 导出 ESG 记录数据
// 权限要求：所有已登录用户（查看者、录入者、审计者、管理员）
export default defineEventHandler(async (event) => {
  try {
    // 验证权限
    await requireViewer(event)
    const { subModuleCode, period, status } = await readBody(event)

    // 验证参数
    if (!subModuleCode) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: "缺少 subModuleCode 参数"
      }))
    }

    // 获取子模块及其关联的指标
    const subModule = await db.query.esgSubModules.findFirst({
      where: eq(esgSubModules.code, subModuleCode)
    })

    if (!subModule) {
      return {
        success: true,
        data: null,
        message: "子模块不存在"
      }
    }

    // 获取子模块下的分类
    const categories = await db.query.esgCategories.findMany({
      where: eq(esgCategories.subModuleId, subModule.id)
    })

    const categoryIds = categories.map(c => c.id)
    if (categoryIds.length === 0) {
      return {
        success: true,
        data: null,
        message: "暂无数据可导出"
      }
    }

    // 获取分类下的指标
    const metrics = await db.query.esgMetrics.findMany({
      where: inArray(esgMetrics.categoryId, categoryIds)
    })

    const metricIds = metrics.map(m => m.id)
    if (metricIds.length === 0) {
      return {
        success: true,
        data: null,
        message: "暂无数据可导出"
      }
    }

    // 构建查询条件
    const conditions = [inArray(esgRecords.metricId, metricIds)]

    if (period) {
      conditions.push(eq(esgRecords.period, period))
    }

    if (status) {
      conditions.push(eq(esgRecords.status, status))
    }

    // 查询数据
    const records = await db.query.esgRecords.findMany({
      where: and(...conditions),
      orderBy: [desc(esgRecords.updatedAt)]
    })

    // 获取指标信息映射
    const metricsMap = new Map(metrics.map(m => [m.id, m]))

    // 转换数据为表格格式
    const rows = records.map(record => {
      const metric = metricsMap.get(record.metricId)
      return {
        "指标名称": metric?.name || "",
        "周期": record.period,
        "数值": record.valueNumber ?? record.valueText ?? (record.valueJson ? JSON.parse(record.valueJson) : "") ?? "",
        "状态": getStatusLabel(record.status || 'draft'),
        "更新时间": record.updatedAt ? new Date(record.updatedAt).toLocaleString("zh-CN") : ""
      }
    })

    // 如果没有数据
    if (rows.length === 0) {
      return {
        success: true,
        data: null,
        message: "暂无数据可导出"
      }
    }

    // 生成 CSV 格式
    const csv = convertToCSV(rows)

    // 创建临时文件路径
    const fileName = `ESG_${subModuleCode}_${Date.now()}.csv`
    const exportDir = path.join(process.cwd(), "public", "exports")
    const filePath = path.join(exportDir, fileName)

    // 确保目录存在
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true })
    }

    // 写入文件 (使用 UTF-8 BOM 以支持 Excel 正确显示中文)
    fs.writeFileSync(filePath, "\uFEFF" + csv, "utf-8")

    return {
      success: true,
      data: {
        url: `/exports/${fileName}`,
        fileName: fileName
      }
    }
  } catch (e: any) {
    console.error("导出失败:", e)
    throw createError({
      statusCode: 500,
      statusMessage: e.message || "导出失败"
    })
  }
})

// 获取状态标签
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "草稿",
    submitted: "已提交",
    approved: "已审核",
    rejected: "已退回"
  }
  return labels[status] || status
}

// 转换为 CSV
function convertToCSV(rows: any[]): string {
  if (rows.length === 0) return ""

  const headers = Object.keys(rows[0])
  const headerRow = headers.map(h => escapeCSVValue(h)).join(",")

  const dataRows = rows.map(row =>
    headers
      .map(header => escapeCSVValue(String(row[header] ?? "")))
      .join(",")
  )

  return [headerRow, ...dataRows].join("\n")
}

// 转义 CSV 值
function escapeCSVValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
