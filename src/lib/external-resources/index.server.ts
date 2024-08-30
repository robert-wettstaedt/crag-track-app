import { db } from '$lib/db/db.server.js'
import {
  blocks,
  routeExternalResource27crags,
  routeExternalResource8a,
  routeExternalResources,
  routeExternalResourceTheCrag,
  userExternalResources,
  users,
  type Area,
  type Ascent,
  type Route,
  type UserExternalResource,
} from '$lib/db/schema'
import { geolocations, routes, type Block } from '$lib/db/schema.js'
import type { NestedArea } from '$lib/db/types'
import { buildNestedAreaQuery } from '$lib/db/utils'
import type { Session } from '@auth/sveltekit'
import { eq } from 'drizzle-orm'
import handler27crags from './27crags.server'
import handler8a from './8a.server'
import handlerTheCrag from './thecrag.server'

export interface ExternalResourceHandler<ExternalResource, SessionReturnType> {
  postUrl?: string
  query: (
    query: string,
    blockId: number,
    crag: Area | null,
    sector: Area | null,
    userExternalResource: UserExternalResource | null | undefined,
  ) => Promise<ExternalResource | null>
  convertToRoute: (data: ExternalResource) => Route
  checkSession: (
    externalResourceId: number | null,
    userExternalResource: UserExternalResource,
  ) => Promise<SessionReturnType | null>
  logAscent: (
    ascent: Ascent,
    externalResourceId: number | null,
    userExternalResource: UserExternalResource,
    session: SessionReturnType,
  ) => Promise<void>
}

export const queryExternalResource = async (query: string, blockId: number, session: Session | null) => {
  const block = await db.query.blocks.findFirst({
    where: eq(blocks.id, Number(blockId)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  if (block == null) {
    throw new Error('Block not found')
  }

  const user =
    session?.user?.email == null
      ? null
      : await db.query.users.findFirst({
          where: eq(users.email, session.user.email),
        })

  const userExternalResource =
    user == null
      ? null
      : await db.query.userExternalResources.findFirst({
          where: eq(userExternalResources.userFk, user.id),
        })

  let sector: Area | null = null
  let crag: Area | null = null

  let area = block.area as NestedArea
  while (area != null) {
    if (area.type === 'sector') {
      sector = area
    }
    if (area.type === 'crag') {
      crag = area
    }
    area = area.parent as NestedArea
  }

  const [data8a, data27crags, dataTheCrag] = await Promise.all([
    handler8a.query(query, blockId, crag, sector, userExternalResource),
    handler27crags.query(query, blockId, crag, sector, userExternalResource),
    handlerTheCrag.query(query, blockId, crag, sector, userExternalResource),
  ])

  return { data8a, data27crags, dataTheCrag }
}

export const insertExternalResources = async (route: Route, block: Block, session: Session | null) => {
  if (route.name.length === 0) {
    return
  }

  const externalResources = await queryExternalResource(route.name, block.id, session)

  if (
    externalResources?.data8a == null &&
    externalResources?.data27crags == null &&
    externalResources?.dataTheCrag == null
  ) {
    return
  }

  let resource = await db.query.routeExternalResources.findFirst({
    where: eq(routeExternalResources.routeFk, route.id),
  })

  if (resource == null) {
    ;[resource] = await db.insert(routeExternalResources).values({ routeFk: route.id }).returning()
    await db.update(routes).set({ externalResourcesFk: resource.id }).where(eq(routes.id, route.id))
  }

  const resource8a = await (async () => {
    if (externalResources.data8a == null) {
      return null
    }

    let resource8a = await db.query.routeExternalResource8a.findFirst({
      where: eq(routeExternalResource8a.externalResourcesFk, resource.id),
    })

    if (resource8a == null) {
      ;[resource8a] = await db
        .insert(routeExternalResource8a)
        .values({
          ...externalResources.data8a,
          id: undefined,
          externalResourcesFk: resource.id,
        })
        .returning()
    }

    return resource8a
  })()

  const resource27crags = await (async () => {
    if (externalResources.data27crags == null) {
      return null
    }

    let resource27crags = await db.query.routeExternalResource27crags.findFirst({
      where: eq(routeExternalResource27crags.externalResourcesFk, resource.id),
    })

    if (resource27crags == null) {
      ;[resource27crags] = await db
        .insert(routeExternalResource27crags)
        .values({
          ...externalResources.data27crags,
          id: undefined,
          externalResourcesFk: resource.id,
        })
        .returning()
    }

    return resource27crags
  })()

  const resourceTheCrag = await (async () => {
    if (externalResources.dataTheCrag == null) {
      return null
    }

    let resourceTheCrag = await db.query.routeExternalResourceTheCrag.findFirst({
      where: eq(routeExternalResourceTheCrag.externalResourcesFk, resource.id),
    })

    if (resourceTheCrag == null) {
      ;[resourceTheCrag] = await db
        .insert(routeExternalResourceTheCrag)
        .values({
          ...externalResources.dataTheCrag,
          id: undefined,
          externalResourcesFk: resource.id,
        })
        .returning()
    }

    return resourceTheCrag
  })()

  await db
    .update(routeExternalResources)
    .set({
      externalResource8aFk: resource8a?.id,
      externalResource27cragsFk: resource27crags?.id,
      externalResourceTheCragFk: resourceTheCrag?.id,
    })
    .where(eq(routeExternalResources.id, resource.id))

  if (
    externalResources.data27crags?.latitude != null &&
    externalResources.data27crags?.longitude != null &&
    block.geolocationFk == null
  ) {
    const [geolocation] = await db
      .insert(geolocations)
      .values({
        blockFk: block.id,
        lat: externalResources.data27crags.latitude,
        long: externalResources.data27crags.longitude,
      })
      .returning()
    await db.update(blocks).set({ geolocationFk: geolocation.id }).where(eq(blocks.id, block.id))
  }
}

export const checkExternalSessions = async (route: Route, session: Session) => {
  const routeExternalResource = await db.query.routeExternalResources.findFirst({
    where: eq(routeExternalResources.routeFk, route.id),
  })

  const user =
    session.user?.email == null
      ? null
      : await db.query.users.findFirst({
          where: eq(users.email, session.user.email),
        })

  const userExternalResource =
    user == null
      ? null
      : await db.query.userExternalResources.findFirst({
          where: eq(userExternalResources.userFk, user.id),
        })

  if (routeExternalResource == null || userExternalResource == null) {
    return null
  }

  const [session8a, session27crags, sessionTheCrag] = await Promise.all([
    handler8a.checkSession(routeExternalResource.externalResource8aFk, userExternalResource),
    handler27crags.checkSession(routeExternalResource.externalResource27cragsFk, userExternalResource),
    handlerTheCrag.checkSession(routeExternalResource.externalResourceTheCragFk, userExternalResource),
  ])

  return { routeExternalResource, userExternalResource, session8a, session27crags, sessionTheCrag }
}

export const logExternalAscent = async (ascent: Ascent, opts: Awaited<ReturnType<typeof checkExternalSessions>>) => {
  if (opts == null) {
    return
  }

  const { routeExternalResource, userExternalResource, session8a, session27crags, sessionTheCrag } = opts

  await Promise.all([
    session8a == null
      ? Promise.resolve()
      : handler8a.logAscent(ascent, routeExternalResource.externalResource8aFk, userExternalResource, session8a),

    session27crags == null
      ? Promise.resolve()
      : handler27crags.logAscent(
          ascent,
          routeExternalResource.externalResource27cragsFk,
          userExternalResource,
          session27crags,
        ),

    sessionTheCrag == null
      ? Promise.resolve()
      : handlerTheCrag.logAscent(
          ascent,
          routeExternalResource.externalResourceTheCragFk,
          userExternalResource,
          sessionTheCrag,
        ),
  ])
}

export * from './27crags.server'
export { default as handler27crags } from './27crags.server'
export * from './8a.server'
export { default as handler8a } from './8a.server'
export * from './thecrag.server'
export { default as handlerTheCrag } from './thecrag.server'
