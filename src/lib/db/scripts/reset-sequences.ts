import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import Database from 'postgres'
import drizzleConfig from '../../../../drizzle.config'
import * as schema from '../schema'

const postgres = Database(drizzleConfig.dbCredentials.url, { prepare: false })
const db = drizzle(postgres, { schema })

const results = await db.execute(sql`SELECT
    t.relname AS table_name,
    s.last_value
FROM
    pg_class t
JOIN
    pg_namespace n ON n.oid = t.relnamespace
JOIN
    pg_sequences s ON s.sequencename = t.relname || '_id_seq'
WHERE
    n.nspname = 'public' AND
    t.relkind = 'r';`)

await Promise.all(
  Array.from(results).map((result) => {
    console.log(result.table_name, result.last_value)

    return db.execute(
      sql.raw(`SELECT setval('${result.table_name}_id_seq', (SELECT MAX(id) FROM ${result.table_name}));`),
    )
  }),
)

await postgres.end()
