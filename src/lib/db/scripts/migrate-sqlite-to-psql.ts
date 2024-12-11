import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import config from '../../../../drizzle.config'
import * as schema from '../schema'

// Reference to existing schema in dependency order
const tables = [
  { name: 'user_settings', table: schema.userSettings },
  { name: 'users', table: schema.users },
  { name: 'areas', table: schema.areas },
  { name: 'geolocations', table: schema.geolocations },
  { name: 'blocks', table: schema.blocks },
  { name: 'grades', table: schema.grades },
  { name: 'first_ascents', table: schema.firstAscents },
  { name: 'route_external_resources', table: schema.routeExternalResources },
  { name: 'route_external_resource_8a', table: schema.routeExternalResource8a },
  { name: 'route_external_resource_27crags', table: schema.routeExternalResource27crags },
  { name: 'route_external_resource_the_crag', table: schema.routeExternalResourceTheCrag },
  { name: 'routes', table: schema.routes },
  { name: 'ascents', table: schema.ascents },
  { name: 'files', table: schema.files },
  { name: 'topos', table: schema.topos },
  { name: 'topo_routes', table: schema.topoRoutes },
  { name: 'tags', table: schema.tags },
  { name: 'routes_to_tags', table: schema.routesToTags },
]

async function migrateData() {
  // Connect to SQLite
  const sqlite = new Database('./db/sqlite.db')
  sqlite.exec('PRAGMA journal_mode = WAL;')
  const dbSqlite = drizzleSqlite(sqlite, { schema })

  // Connect to Supabase
  const client = postgres(config.dbCredentials.url, {
    prepare: false,
  })
  const dbSupabase = drizzle(client, { schema })

  try {
    // First run migrations
    console.log('Running migrations...')
    await migrate(dbSupabase, { migrationsFolder: 'drizzle' })
    console.log('✓ Migrations complete')

    // Temporarily disable all foreign key constraints
    await client.unsafe(`SET session_replication_role = 'replica';`)

    // Migrate data
    for (const { name, table } of tables) {
      console.log(`Migrating ${name}...`)

      const data = await dbSqlite.select().from(table)

      if (data.length > 0) {
        // Insert in batches
        const batchSize = 1000
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize)
          await dbSupabase.insert(table).values(batch)
        }

        console.log(`✓ Migrated ${data.length} rows from ${name}`)
      } else {
        console.log(`- No data to migrate for ${name}`)
      }
    }

    // Re-enable foreign key constraints
    await client.unsafe(`SET session_replication_role = 'origin';`)

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    // Re-enable foreign key constraints even if migration fails
    await client.unsafe(`SET session_replication_role = 'origin';`)
    throw error
  } finally {
    await client.end()
    sqlite.close()
  }
}

// Run migration
migrateData().catch(console.error)
