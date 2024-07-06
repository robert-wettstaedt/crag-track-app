import Database from 'better-sqlite3'
import { eq, like, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

const sqlite = new Database('./db/sqlite.db')
const db = drizzle(sqlite, { schema })

migrate(db, { migrationsFolder: 'drizzle' })

await db.update(schema.routes).set({ rating: null }).where(eq(schema.routes.rating, ''))

const maWiFirstAscentsResult = await db.query.firstAscents.findMany({
  where: or(like(schema.firstAscents.climberName, '%M. Windisch%'), like(schema.firstAscents.climberName, '%MaWi%')),
})

await Promise.all(
  maWiFirstAscentsResult.map((fa) => {
    return db
      .update(schema.firstAscents)
      .set({
        climberName: fa.climberName?.replaceAll('M. Windisch', 'Markus Windisch').replaceAll('MaWi', 'Markus Windisch'),
      })
      .where(eq(schema.firstAscents.id, fa.id))
  }),
)
