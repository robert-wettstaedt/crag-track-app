import { PUBLIC_DEMO_MODE } from '$env/static/public'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from './schema'

const dbPath = path.join(process.cwd(), PUBLIC_DEMO_MODE ? 'demo-db' : 'db', 'sqlite.db')

const sqlite = new Database(dbPath)
sqlite.exec('PRAGMA journal_mode = WAL;')
export const db = drizzle(sqlite, { schema })
