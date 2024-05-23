import { PUBLIC_DEMO_MODE } from '$env/static/public'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database(`${PUBLIC_DEMO_MODE ? 'demo-db' : 'db'}/sqlite.db`)
sqlite.exec('PRAGMA journal_mode = WAL;')
export const db = drizzle(sqlite, { schema })
