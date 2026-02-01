/**
 * 导出报告
 * POST /api/reports/:id/export
 * 
 * 权限：所有已登录用户
 */
import { db, esgReports } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireViewer } from '../../../utils/auth'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  // 验证权限
  await requireViewer(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)
  const { format = 'html' } = body // html, pdf, docx

  if (!id || isNaN(id)) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '无效的报告 ID'
    }))
  }

  // 获取报告
  const report = await db.query.esgReports.findFirst({
    where: eq(esgReports.id, id)
  })

  if (!report) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: '报告不存在'
    }))
  }

  if (!report.htmlContent) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: '报告尚未生成，请先生成报告'
    }))
  }

  // 确保导出目录存在
  const exportDir = './data/exports'
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  const timestamp = Date.now()
  const baseFileName = `report_${id}_${timestamp}`

  if (format === 'html') {
    // 直接返回 HTML 内容
    const fileName = `${baseFileName}.html`
    const filePath = path.join(exportDir, fileName)

    fs.writeFileSync(filePath, report.htmlContent)

    // 更新导出文件记录
    const exportFiles = report.exportFiles ? JSON.parse(report.exportFiles) : {}
    exportFiles.html = filePath

    await db.update(esgReports)
      .set({ exportFiles: JSON.stringify(exportFiles) })
      .where(eq(esgReports.id, id))

    // 设置响应头并返回文件
    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(report.title)}.html"`)

    return report.htmlContent
  }

  if (format === 'pdf') {
    // PDF 导出需要 Puppeteer，这里返回提示
    // 实际生产环境中应该使用 Puppeteer 或 wkhtmltopdf

    // 简单实现：返回 HTML 并提示用户使用浏览器打印为 PDF
    return {
      success: true,
      data: {
        message: 'PDF 导出功能需要配置 Puppeteer。当前可以使用浏览器打开 HTML 文件后打印为 PDF。',
        htmlUrl: `/api/reports/${id}/export?format=html`,
        tip: '在浏览器中打开报告预览页面，使用 Ctrl+P 打印并选择"另存为 PDF"'
      }
    }
  }

  if (format === 'docx') {
    // Word 导出需要 docx 库
    return {
      success: true,
      data: {
        message: 'Word 导出功能需要配置 docx 库。',
        htmlUrl: `/api/reports/${id}/export?format=html`,
        tip: '可以将 HTML 文件在 Word 中打开并保存为 docx 格式'
      }
    }
  }

  return sendError(event, createError({
    statusCode: 400,
    statusMessage: `不支持的导出格式: ${format}`
  }))
})