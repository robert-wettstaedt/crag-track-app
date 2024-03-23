import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

const sqlite = new Database('sqlite.db')
sqlite.exec('PRAGMA journal_mode = WAL;')
export const db = drizzle(sqlite)
