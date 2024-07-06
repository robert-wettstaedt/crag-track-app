import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

const sqlite = new Database('./db/sqlite.db')
const db = drizzle(sqlite, { schema })

migrate(db, { migrationsFolder: 'drizzle' })

await db.update(schema.routes).set({ rating: null }).where(eq(schema.routes.rating, ''))
