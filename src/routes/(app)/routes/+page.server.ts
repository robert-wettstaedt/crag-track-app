import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { ascents, routes, users } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichRoute } from '$lib/db/utils'
import { asc, count, desc, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, url }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  const user = await db(async (tx) =>
    locals.user == null
      ? null
      : tx.query.users.findFirst({
          where: eq(users.authUserFk, locals.user.id),
        }),
  )

  // Get the 'page' parameter from the URL, defaulting to 0 if not provided
  const page = Number(url.searchParams.get('page') ?? '1')
  // Set the number of results per page
  const pageSize = 20

  const routesResult = await db((tx) =>
    tx.query.routes.findMany({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: [desc(routes.rating), asc(routes.gradeFk)],
      where: isNotNull(routes.rating),
      with: {
        ascents: user == null ? { limit: 0 } : { where: eq(ascents.createdBy, user.id) },
        block: {
          with: {
            area: buildNestedAreaQuery(),
          },
        },
      },
    }),
  )

  const countResults = await db((tx) => tx.select({ count: count() }).from(routes).where(isNotNull(routes.rating)))
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
