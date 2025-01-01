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
    .map((area) => ({ ...area, old: area.slug, new: schema.generateSlug(area.name) }))
    .map((area) => db.update(schema.areas).set({ slug: area.new }).where(eq(schema.areas.id, area.id))),
)

console.log('blocks...')

const allBlocks = await db.query.blocks.findMany()

await Promise.all(
  allBlocks
    .map((block) => ({ ...block, old: block.slug, new: schema.generateSlug(block.name) }))
    .map((block) => db.update(schema.blocks).set({ slug: block.new }).where(eq(schema.blocks.id, block.id))),
)

console.log('routes...')

const allRoutes = await db.query.routes.findMany()

await Promise.all(
  allRoutes
    .map((route) => ({ ...route, old: route.slug, new: schema.generateSlug(route.name) }))
    .map((route) => db.update(schema.routes).set({ slug: route.new }).where(eq(schema.routes.id, route.id))),
)

await postgres.end()
