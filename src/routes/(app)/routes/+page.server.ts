import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { ascents, routes, users } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichRoute } from '$lib/db/utils'
import { validateObject } from '$lib/forms.server'
import { getPaginationQuery, paginationParamsSchema } from '$lib/pagination.server'
import { asc, count, desc, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, url }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  return await db(async (db) => {
    const user =
      locals.user == null
        ? null
        : await db.query.users.findFirst({
            where: eq(users.authUserFk, locals.user.id),
          })

    const searchParamsObj = Object.fromEntries(url.searchParams.entries())
    const searchParams = await validateObject(paginationParamsSchema, searchParamsObj)

    const routesResult = await db.query.routes.findMany({
      ...getPaginationQuery(searchParams),
      orderBy: [desc(routes.rating), asc(routes.gradeFk), asc(routes.id)],
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
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        total: countResults[0].count,
      },
    }
  })
}) satisfies PageServerLoad
