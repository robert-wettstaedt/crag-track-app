import { db } from '$lib/db/db.server'
import { like, or } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { areas, routes, crags, users } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichArea, enrichRoute, enrichCrag } from '$lib/db/utils'

export const load = (async ({ url }) => {
  const query = url.searchParams.get('q')

  if (query == null || query.length < 3) {
    return
  }

  const searchString = `%${query}%`

  const areasResult = await db.query.areas.findMany({
    where: like(areas.name, searchString),
    with: {
      parent: buildNestedAreaQuery(),
    },
  })

  const cragsResult = await db.query.crags.findMany({
    where: like(crags.name, searchString),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  const routesResult = await db.query.routes.findMany({
    where: like(routes.name, searchString),
    with: {
      crag: {
        with: {
          area: buildNestedAreaQuery(),
        },
      },
    },
  })

  const usersResult = await db.query.users.findMany({
    where: or(like(users.email, searchString), like(users.userName, searchString)),
  })

  return {
    searchResults: {
      routes: routesResult.map(enrichRoute),
      crags: cragsResult.map(enrichCrag),
      areas: areasResult.map(enrichArea),
      users: usersResult,
    },
  }
}) satisfies PageServerLoad
