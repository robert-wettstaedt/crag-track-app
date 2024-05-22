import { db } from '$lib/db/db.server'
import { ascents, type Ascent } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichRoute } from '$lib/db/utils'
import { count, desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ url }) => {
  // Get the 'orderBy' parameter from the URL, defaulting to 'dateTime' if not provided
  const orderBy = (url.searchParams.get('orderBy') ?? 'dateTime') as keyof Ascent
  // Get the 'page' parameter from the URL, defaulting to 0 if not provided
  const page = Number(url.searchParams.get('page') ?? '0')
  // Set the number of results per page
  const pageSize = 15

  // Query the database for ascents, ordering by the specified field, with pagination
  const ascentsResults = await db.query.ascents.findMany({
    orderBy: desc(ascents[orderBy]),
    offset: page * pageSize,
    limit: pageSize,
    with: {
      author: true,
      route: {
        with: {
          block: {
            with: {
              area: buildNestedAreaQuery(),
            },
          },
        },
      },
    },
  })

  // Query the database to get the total count of ascents
  const countResults = await db.select({ count: count() }).from(ascents)
  // Enrich each ascent result with additional route information
  const enrichedAscents = ascentsResults.map((ascent) => ({ ...ascent, route: enrichRoute(ascent.route) }))

  // Return the enriched ascents and pagination information
  return {
    ascents: enrichedAscents,
    pagination: {
      orderBy,
      page,
      pageSize,
      total: countResults[0].count,
    },
  }
}) satisfies PageServerLoad
