import { PUBLIC_DEMO_MODE } from '$env/static/public'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import * as schema from './schema'

const dirname = fileURLToPath(import.meta.url)
const dbPath = path.join(dirname, '..', '..', '..', '..', PUBLIC_DEMO_MODE ? 'demo-db' : 'db', 'sqlite.db')
console.log(dbPath)

const sqlite = new Database(dbPath)
sqlite.exec('PRAGMA journal_mode = WAL;')
export const db = drizzle(sqlite, { schema })
