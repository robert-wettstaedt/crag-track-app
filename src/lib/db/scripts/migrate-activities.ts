import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '../schema'

export const migrate = async (db: PostgresJsDatabase<typeof schema>) => {
  await db.delete(schema.activities)

  const areas = await db.query.areas.findMany({ with: { parent: true } })
  const activities = areas.map(
    (area): schema.InsertActivity => ({
      type: 'created',
      entityId: area.id,
      entityType: 'area',
      userFk: area.createdBy,
      createdAt: area.createdAt,
      parentEntityId: area.parent?.id,
      parentEntityType: area.parent == null ? undefined : 'area',
    }),
  )

  const blocks = await db.query.blocks.findMany({ with: { area: true } })
  activities.push(
    ...blocks.map(
      (block): schema.InsertActivity => ({
        type: 'created',
        entityId: block.id,
        entityType: 'block',
        userFk: block.createdBy,
        createdAt: block.createdAt,
        parentEntityId: block.area?.id,
        parentEntityType: block.area == null ? undefined : 'area',
      }),
    ),
  )

  const routes = await db.query.routes.findMany({ with: { block: true } })
  activities.push(
    ...routes.map(
      (route): schema.InsertActivity => ({
        type: 'created',
        entityId: route.id,
        entityType: 'route',
        userFk: route.createdBy,
        createdAt: route.createdAt,
        parentEntityId: route.block?.id,
        parentEntityType: route.block == null ? undefined : 'block',
      }),
    ),
  )

  const ascents = await db.query.ascents.findMany({ with: { route: true } })
  activities.push(
    ...ascents.map(
      (ascent): schema.InsertActivity => ({
        type: 'created',
        entityId: ascent.id,
        entityType: 'ascent',
        userFk: ascent.createdBy,
        createdAt: ascent.createdAt,
        parentEntityId: ascent.route?.id,
        parentEntityType: ascent.route == null ? undefined : 'route',
      }),
    ),
  )

  const users = await db.query.users.findMany()
  activities.push(
    ...users.map(
      (user): schema.InsertActivity => ({
        type: 'created',
        entityId: user.id,
        entityType: 'user',
        userFk: user.id,
        createdAt: user.createdAt,
        newValue: user.username,
      }),
    ),
  )

  await db.insert(schema.activities).values(activities)
}
