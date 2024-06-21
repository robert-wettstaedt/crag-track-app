import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import { eq, sql } from 'drizzle-orm'

const sqlite = new Database('./db/sqlite.db')
const db = drizzle(sqlite, { schema })

const blocksResult = db.all(sql`SELECT * FROM ${schema.blocks} WHERE lat IS NOT NULL AND long IS NOT NULL`)

migrate(db, { migrationsFolder: 'drizzle' })

const geolocations = await db
  .insert(schema.geolocations)
  .values(blocksResult.map((block) => ({ lat: block.lat, long: block.long, blockFk: block.id })))
  .returning()

await Promise.all(
  geolocations.map(async (geolocation) =>
    db.update(schema.blocks).set({ geolocationFk: geolocation.id }).where(eq(schema.blocks.id, geolocation.blockFk!)),
  ),
)
