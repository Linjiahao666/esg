import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './server/database/migrations',
  schema: './server/database/schema.ts',
  dialect: 'turso',
  dbCredentials: {
    url: 'file:./data/esg.db'
  }
})
