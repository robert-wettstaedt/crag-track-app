import type { ActivityDTO, Entity } from '$lib/components/ActivityFeed'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import type { InsertActivity } from '$lib/db/schema'
import * as schema from '$lib/db/schema'
import type { IncludeRelation, InferResultType } from '$lib/db/types'
import { buildNestedAreaQuery } from '$lib/db/utils'
import { validateObject } from '$lib/forms.server'
import { convertMarkdownToHtml } from '$lib/markdown'
import { loadFiles } from '$lib/nextcloud/nextcloud.server'
import { getPaginationQuery, paginationParamsSchema } from '$lib/pagination.server'
import { and, asc, count, desc, eq, type SQLWrapper } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { z } from 'zod'

const getQuery = (db: PostgresJsDatabase<typeof schema>, entityType: schema.Activity['entityType']) => {
  switch (entityType) {
    case 'area':
      return db.query.areas
    case 'block':
      return db.query.blocks
    case 'route':
      return db.query.routes
    case 'file':
      return db.query.files
    case 'ascent':
      return db.query.ascents
    case 'user':
      return db.query.users
  }
}

const getWith = (
  entityType: schema.Activity['entityType'],
): IncludeRelation<'ascents' | 'routes' | 'blocks' | 'areas'> => {
  switch (entityType) {
    case 'ascent':
      return { author: true, files: true } as IncludeRelation<'ascents'>
    default:
      return {}
  }
}

const getParentWith = (
  entityType: schema.Activity['parentEntityType'],
): IncludeRelation<'routes' | 'blocks' | 'areas'> => {
  const blockWith = { area: buildNestedAreaQuery(2) } as IncludeRelation<'blocks'>
  const routeWith = { block: { with: blockWith } } as IncludeRelation<'routes'>

  switch (entityType) {
    case 'route':
      return routeWith
    case 'block':
      return blockWith
    case 'area':
      return { parent: buildNestedAreaQuery(2) } as IncludeRelation<'areas'>
    default:
      return {}
  }
}

const postProcessEntity = async (
  db: PostgresJsDatabase<typeof schema>,
  entityType: schema.Activity['entityType'],
  object: unknown,
): Promise<Entity> => {
  if (entityType === 'ascent' && object != null) {
    const ascent = object as InferResultType<'ascents', { author: true; files: true }>
    ascent.files = await loadFiles(ascent.files ?? [])
    const notes = await convertMarkdownToHtml(ascent.notes ?? '', db)
    return { type: 'ascent', object: { ...ascent, notes } }
  }

  if (entityType === 'file' && object != null) {
    const file = object as InferResultType<'files'>
    const [fileDTO] = await loadFiles([file])
    return { type: 'file', object: fileDTO }
  }

  if (entityType === 'route' && object != null) {
    const route = object as InferResultType<'routes', { block: { with: { area: { with: { parent: true } } } } }>
    const breadcrumb = [route.block?.area?.parent?.name, route.block?.area?.name, route.block?.name].filter(
      Boolean,
    ) as Entity['breadcrumb']
    const description = await convertMarkdownToHtml(route.description ?? '', db)
    return { type: 'route', object: { ...route, description }, breadcrumb }
  }

  if (entityType === 'block' && object != null) {
    const block = object as InferResultType<'blocks', { area: { with: { parent: true } } }>
    const breadcrumb = [block.area?.parent?.name, block.area?.name].filter(Boolean) as Entity['breadcrumb']
    return { type: 'block', object: block, breadcrumb }
  }

  if (entityType === 'area' && object != null) {
    const area = object as InferResultType<'areas', { parent: true }>
    const breadcrumb = [area.parent?.name].filter(Boolean) as Entity['breadcrumb']
    const description = await convertMarkdownToHtml(area.description ?? '', db)
    return { type: 'area', object: { ...area, description }, breadcrumb }
  }

  return { type: entityType, object } as Entity
}

const searchParamsSchema = z.intersection(
  z.object({
    type: z.string().optional(),
  }),
  paginationParamsSchema,
)

export const loadFeed = async ({ locals, url }: { locals: App.Locals; url: URL }, queries?: SQLWrapper[]) => {
  const searchParamsObj = Object.fromEntries(url.searchParams.entries())
  const searchParams = await validateObject(searchParamsSchema, searchParamsObj)

  const where =
    searchParams.type === 'ascents'
      ? and(eq(schema.activities.entityType, 'ascent'), eq(schema.activities.type, 'created'), ...(queries ?? []))
      : queries == null
        ? undefined
        : and(...queries)

  const db = await createDrizzleSupabaseClient(locals.supabase)
  const activities = await db((tx) =>
    tx.query.activities.findMany({
      ...getPaginationQuery(searchParams),
      orderBy: [desc(schema.activities.createdAt), asc(schema.activities.id)],
      where: where,
      with: {
        user: true,
      },
    }),
  )

  const activitiesDTOs = await db((tx) => {
    return Promise.all(
      activities.map(async (activity): Promise<ActivityDTO> => {
        const query = getQuery(tx, activity.entityType)
        const parentQuery = activity.parentEntityType == null ? null : getQuery(tx, activity.parentEntityType)

        const entity = await query.findFirst({
          where: (table) => eq(table.id, activity.entityId),
          with: getWith(activity.entityType),
        })
        const parentEntity =
          activity.parentEntityId == null && activity.parentEntityType == null
            ? null
            : await parentQuery?.findFirst({
                where: (table) => eq(table.id, activity.parentEntityId!),
                with: getParentWith(activity.parentEntityType),
              })

        return {
          ...activity,
          entity: await postProcessEntity(tx, activity.entityType, entity),
          entityName: entity?.name,
          parentEntity:
            activity.parentEntityType == null || parentEntity == null
              ? undefined
              : await postProcessEntity(tx, activity.parentEntityType, parentEntity),
          parentEntityName: parentEntity?.name,
        }
      }),
    )
  })

  const countResults = await db((tx) => tx.select({ count: count() }).from(schema.activities).where(and(where)))

  return {
    activities: activitiesDTOs,
    pagination: {
      page: searchParams.page,
      pageSize: searchParams.pageSize,
      total: countResults[0].count,
      totalPages: Math.ceil(countResults[0].count / searchParams.pageSize),
    },
  }
}

interface HandleOpts
  extends Pick<InsertActivity, 'entityId' | 'entityType' | 'userFk' | 'parentEntityId' | 'parentEntityType'> {
  oldEntity: Record<string, unknown>
  newEntity: Record<string, unknown>
  db: PostgresJsDatabase<typeof schema>
}

export const createUpdateActivity = async ({
  oldEntity,
  newEntity,
  db,
  entityId,
  entityType,
  userFk,
  parentEntityId,
  parentEntityType,
}: HandleOpts) => {
  const changes: Pick<InsertActivity, 'columnName' | 'oldValue' | 'newValue'>[] = []

  Object.keys(newEntity).forEach((key) => {
    if (String(oldEntity[key] ?? null) !== String(newEntity[key] ?? null)) {
      changes.push({
        columnName: key,
        oldValue: oldEntity[key] == null ? null : String(oldEntity[key]),
        newValue: newEntity[key] == null ? null : String(newEntity[key]),
      })
    }
  })

  if (changes.length > 0) {
    await Promise.all(
      changes.map((change) =>
        db.insert(schema.activities).values({
          type: 'updated',
          userFk,
          entityId,
          entityType,
          columnName: change.columnName,
          oldValue: change.oldValue,
          newValue: change.newValue,
          parentEntityId,
          parentEntityType,
        }),
      ),
    )
  }
}
