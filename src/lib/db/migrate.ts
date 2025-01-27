import { and, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import Database from 'postgres'
import drizzleConfig from '../../../drizzle.config'
import * as schema from './schema'

const postgres = Database(drizzleConfig.dbCredentials.url, { prepare: false })
const db = drizzle(postgres, { schema })

await migrate(db, { migrationsFolder: 'drizzle' })

await db
  .update(schema.areas)
  .set({ visibility: 'public' })
  .where(and(isNull(schema.areas.parentFk), isNull(schema.areas.visibility)))

await postgres.end()
