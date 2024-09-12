import { db } from '$lib/db/db.server'
import * as schema from '$lib/db/schema'
import { geolocations, routes, type Area, type Ascent, type Block, type Route, type UserSettings } from '$lib/db/schema'
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
    cragName: string | null | undefined,
    sectorName: string | null | undefined,
    userSettings: UserSettings | null | undefined,
  ) => Promise<ExternalResource | null>
  convertToRoute: (data: ExternalResource, grades: schema.Grade[]) => Route
  checkSession: (externalResourceId: number | null, userSettings: UserSettings) => Promise<SessionReturnType | null>
  logAscent: (
    ascent: Ascent,
    externalResourceId: number | null,
    userSettings: UserSettings,
    session: SessionReturnType,
  ) => Promise<void>
}

export const queryExternalResource = async (query: string, blockId: number, session: Session | null) => {
  const block = await db.query.blocks.findFirst({
    where: eq(schema.blocks.id, Number(blockId)),
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
          where: eq(schema.users.email, session.user.email),
        })

  const userSettings =
    user == null
      ? null
      : await db.query.userSettings.findFirst({
          where: eq(schema.userSettings.userFk, user.id),
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

  const cragName = crag?.name.replace(/\(.*\)/g, '').trim()
  const sectorName = sector?.name.replace(/\(.*\)/g, '').trim()

  const [data8a, data27crags, dataTheCrag] = await Promise.all([
    handler8a.query(query, blockId, cragName, sectorName, userSettings),
    handler27crags.query(query, blockId, cragName, sectorName, userSettings),
    handlerTheCrag.query(query, blockId, cragName, sectorName, userSettings),
  ])

  return { data8a, data27crags, dataTheCrag }
}

export const insertExternalResources = async (route: Route, block: Block, session: Session | null) => {
  if (route.name.length === 0) {
    return
  }

  let routeName: string | undefined = route.name.replace(/\(.*\)/g, '').trim()
  let externalResources = await queryExternalResource(routeName, block.id, session)

  if (
    externalResources?.data8a == null &&
    externalResources?.data27crags == null &&
    externalResources?.dataTheCrag == null
  ) {
    routeName = route.name
      .match(/\(.*\)/)
      ?.at(0)
      ?.replace(/\(|\)/g, '')
      ?.trim()

    if (routeName != null) {
      externalResources = await queryExternalResource(routeName, block.id, session)
    }
  }

  if (
    externalResources?.data8a == null &&
    externalResources?.data27crags == null &&
    externalResources?.dataTheCrag == null
  ) {
    return
  }

  let resource = await db.query.routeExternalResources.findFirst({
    where: eq(schema.routeExternalResources.routeFk, route.id),
  })

  if (resource == null) {
    ;[resource] = await db.insert(schema.routeExternalResources).values({ routeFk: route.id }).returning()
    await db.update(routes).set({ externalResourcesFk: resource.id }).where(eq(routes.id, route.id))
  }

  const resource8a = await (async () => {
    if (externalResources.data8a == null) {
      return null
    }

    let resource8a = await db.query.routeExternalResource8a.findFirst({
      where: eq(schema.routeExternalResource8a.externalResourcesFk, resource.id),
    })

    if (resource8a == null) {
      ;[resource8a] = await db
        .insert(schema.routeExternalResource8a)
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
      where: eq(schema.routeExternalResource27crags.externalResourcesFk, resource.id),
    })

    if (resource27crags == null) {
      ;[resource27crags] = await db
        .insert(schema.routeExternalResource27crags)
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
      where: eq(schema.routeExternalResourceTheCrag.externalResourcesFk, resource.id),
    })

    if (resourceTheCrag == null) {
      ;[resourceTheCrag] = await db
        .insert(schema.routeExternalResourceTheCrag)
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
    .update(schema.routeExternalResources)
    .set({
      externalResource8aFk: resource8a?.id,
      externalResource27cragsFk: resource27crags?.id,
      externalResourceTheCragFk: resourceTheCrag?.id,
    })
    .where(eq(schema.routeExternalResources.id, resource.id))

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
    await db.update(schema.blocks).set({ geolocationFk: geolocation.id }).where(eq(schema.blocks.id, block.id))
  }
}

export const checkExternalSessions = async (route: Route, session: Session) => {
  const routeExternalResource = await db.query.routeExternalResources.findFirst({
    where: eq(schema.routeExternalResources.routeFk, route.id),
  })

  const user =
    session.user?.email == null
      ? null
      : await db.query.users.findFirst({
          where: eq(schema.users.email, session.user.email),
        })

  const userSettings =
    user == null
      ? null
      : await db.query.userSettings.findFirst({
          where: eq(schema.userSettings.userFk, user.id),
        })

  if (routeExternalResource == null || userSettings == null) {
    return null
  }

  const [session8a, session27crags, sessionTheCrag] = await Promise.all([
    handler8a.checkSession(routeExternalResource.externalResource8aFk, userSettings),
    handler27crags.checkSession(routeExternalResource.externalResource27cragsFk, userSettings),
    handlerTheCrag.checkSession(routeExternalResource.externalResourceTheCragFk, userSettings),
  ])

  return { routeExternalResource, userSettings, session8a, session27crags, sessionTheCrag }
}

export const logExternalAscent = async (ascent: Ascent, opts: Awaited<ReturnType<typeof checkExternalSessions>>) => {
  if (opts == null || ascent.type === 'attempt') {
    return
  }

  const { routeExternalResource, userSettings, session8a, session27crags, sessionTheCrag } = opts

  await Promise.all([
    session8a == null
      ? Promise.resolve()
      : handler8a.logAscent(ascent, routeExternalResource.externalResource8aFk, userSettings, session8a),

    session27crags == null
      ? Promise.resolve()
      : handler27crags.logAscent(ascent, routeExternalResource.externalResource27cragsFk, userSettings, session27crags),

    sessionTheCrag == null
      ? Promise.resolve()
      : handlerTheCrag.logAscent(ascent, routeExternalResource.externalResourceTheCragFk, userSettings, sessionTheCrag),
  ])
}

export * from './27crags.server'
export { default as handler27crags } from './27crags.server'
export * from './8a.server'
export { default as handler8a } from './8a.server'
export * from './thecrag.server'
export { default as handlerTheCrag } from './thecrag.server'
