import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import { existsSync, mkdirSync } from 'fs'

const dbPath = './data/esg.db'

// 确保数据目录存在
const dataDir = './data'
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// 创建 libsql 客户端
const client = createClient({
  url: `file:${dbPath}`
})

// 创建 Drizzle ORM 实例
export const db = drizzle(client, { schema })

// 导出 schema
export * from './schema'
