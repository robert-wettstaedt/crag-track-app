import { db } from '$lib/db/db.server'
import { areas, ascents, routes } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { like } from 'drizzle-orm'

export interface References {
  areas: InferResultType<'areas'>[]
  ascents: InferResultType<'ascents', { author: true; route: true }>[]
  routes: InferResultType<'routes', { ascents: true }>[]
}

export const getReferences = async (id: number, type: 'routes' | 'blocks' | 'areas'): Promise<References> => {
  return {
    areas: await db.query.areas.findMany({
      where: like(areas.description, `%!${type}:${id}!%`),
    }),
    ascents: await db.query.ascents.findMany({
      where: like(ascents.notes, `%!${type}:${id}!%`),
      with: { author: true, route: true },
    }),
    routes: await db.query.routes.findMany({
      where: like(routes.description, `%!${type}:${id}!%`),
      with: { ascents: true },
    }),
  }
}
