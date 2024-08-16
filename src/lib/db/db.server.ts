import { PUBLIC_DEMO_MODE } from '$env/static/public'
import KeyvSqlite from '@keyv/sqlite'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Keyv from 'keyv'
import demoDataSql from './data/demo.sql?raw'
import * as schema from './schema'

const dbPath = PUBLIC_DEMO_MODE ? ':memory:' : 'db/sqlite.db'

const sqlite = new Database(dbPath)
sqlite.exec('PRAGMA journal_mode = WAL;')
export const db = drizzle(sqlite, { schema })

if (PUBLIC_DEMO_MODE) {
  sqlite.exec(demoDataSql)
}

const keyvSqlite = new KeyvSqlite(`sqlite://${dbPath}`)
export const keyv = new Keyv({ store: keyvSqlite, ttl: 1000 * 60 * 60 })
