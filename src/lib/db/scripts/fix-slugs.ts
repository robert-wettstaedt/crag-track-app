import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import Database from 'postgres'
import drizzleConfig from '../../../../drizzle.config'
import * as schema from '../schema'

const postgres = Database(drizzleConfig.dbCredentials.url, { prepare: false })
const db = drizzle(postgres, { schema })

console.log('areas...')

const allAreas = await db.query.areas.findMany()

await Promise.all(
  allAreas
    .map((item) => ({ ...item, old: item.slug, new: schema.generateSlug(item.name) }))
    .filter((item) => item.new !== item.old)
    .map((item) => db.update(schema.areas).set({ slug: item.new }).where(eq(schema.areas.id, item.id))),
)

console.log('blocks...')

const allBlocks = await db.query.blocks.findMany()

await Promise.all(
  allBlocks
    .map((item) => ({ ...item, old: item.slug, new: schema.generateSlug(item.name) }))
    .filter((item) => item.new !== item.old)
    .map((item) => db.update(schema.blocks).set({ slug: item.new }).where(eq(schema.blocks.id, item.id))),
)

console.log('routes...')

const allRoutes = await db.query.routes.findMany()

await Promise.all(
  allRoutes
    .map((item) => ({ ...item, old: item.slug, new: schema.generateSlug(item.name) }))
    .filter((item) => item.new !== item.old)
    .map((item) => db.update(schema.routes).set({ slug: item.new }).where(eq(schema.routes.id, item.id))),
)

await postgres.end()
