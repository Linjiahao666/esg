import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, extname } from 'path'
import { db, files } from '../../database'
import { requireAuth } from '../../utils/auth'

// 允许的文件类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv'
]
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]

// 最大文件大小（10MB）
const MAX_FILE_SIZE = 10 * 1024 * 1024

// 上传目录
const UPLOAD_DIR = './uploads'

export default defineEventHandler(async (event) => {
  // 验证用户登录
  const user = await requireAuth(event)

  // 确保上传目录存在
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true })
  }

  // 解析 multipart form data
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: '请选择要上传的文件'
    })
  }

  const uploadedFiles: Array<{
    id: number
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    createdAt: Date | null
  }> = []
  const category = (getQuery(event).category as string) || 'general'

  for (const item of formData) {
    if (item.name !== 'file' || !item.data || !item.filename) {
      continue
    }

    const { data, filename: originalName, type: mimeType } = item

    // 验证文件类型
    if (mimeType && !ALL_ALLOWED_TYPES.includes(mimeType)) {
      throw createError({
        statusCode: 400,
        message: `不支持的文件类型: ${mimeType}`
      })
    }

    // 验证文件大小
    if (data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        message: `文件大小超过限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)`
      })
    }

    // 生成唯一文件名
    const ext = extname(originalName || '')
    const uniqueFilename = `${randomUUID()}${ext}`

    // 按日期创建子目录
    const dateStr = new Date().toISOString().split('T')[0] || 'unknown'
    const targetDir = join(UPLOAD_DIR, dateStr)
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    // 保存文件
    const filePath = join(targetDir, uniqueFilename)
    writeFileSync(filePath, new Uint8Array(data))

    // 保存文件记录到数据库
    const result = await db
      .insert(files)
      .values({
        userId: user.id,
        filename: uniqueFilename,
        originalName: originalName || 'unknown',
        mimeType: mimeType || 'application/octet-stream',
        size: data.length,
        path: filePath,
        category
      })
      .returning()

    const fileRecord = result[0]
    if (fileRecord) {
      uploadedFiles.push({
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        url: `/api/files/${fileRecord.id}`,
        createdAt: fileRecord.createdAt
      })
    }
  }

  if (uploadedFiles.length === 0) {
    throw createError({
      statusCode: 400,
      message: '没有有效的文件被上传'
    })
  }

  return {
    success: true,
    message: `成功上传 ${uploadedFiles.length} 个文件`,
    files: uploadedFiles
  }
})
