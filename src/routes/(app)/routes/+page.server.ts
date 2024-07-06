import { db } from '$lib/db/db.server'
import { ascents, routes } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichRoute } from '$lib/db/utils'
import { asc, count, desc, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ parent, url }) => {
  const { user } = await parent()

  // Get the 'page' parameter from the URL, defaulting to 0 if not provided
  const page = Number(url.searchParams.get('page') ?? '0')
  // Set the number of results per page
  const pageSize = 20

  const routesResult = await db.query.routes.findMany({
    limit: pageSize,
    offset: page * pageSize,
    orderBy: [desc(routes.rating), asc(routes.grade)],
    where: isNotNull(routes.rating),
    with: {
      ascents: user == null ? { limit: 0 } : { where: eq(ascents.createdBy, user.id) },
      block: {
        with: {
          area: buildNestedAreaQuery(),
        },
      },
    },
  })

  const countResults = await db.select({ count: count() }).from(routes).where(isNotNull(routes.rating))
  const enrichedRoutes = routesResult.map((route) => ({ ...enrichRoute(route), ascents: route.ascents }))

  return {
    routes: enrichedRoutes,
    pagination: {
      page,
      pageSize,
      total: countResults[0].count,
    },
  }
}) satisfies PageServerLoad
