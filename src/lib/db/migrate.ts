import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

const sqlite = new Database('./db/sqlite.db')
const db = drizzle(sqlite, { schema })

migrate(db, { migrationsFolder: 'drizzle' })

await db.update(schema.routes).set({ rating: null }).where(eq(schema.routes.rating, ''))

const files = await db.query.files.findMany()

for await (const file of files) {
  if (file.path.startsWith('/Documents/topos')) {
    await db
      .update(schema.files)
      .set({ path: file.path.replace('/Documents', '') })
      .where(eq(schema.files.id, file.id))
  } else if (file.path.startsWith('/Pictures/Progressions/Bouldering')) {
    await db
      .update(schema.files)
      .set({ path: file.path.replace('/Pictures/Progressions', '') })
      .where(eq(schema.files.id, file.id))
  } else {
    await db.delete(schema.files).where(eq(schema.files.id, file.id))
  }
}
