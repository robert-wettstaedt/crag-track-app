import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { ascents, type Ascent } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichRoute } from '$lib/db/utils'
import { count, desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, url }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Get the 'orderBy' parameter from the URL, defaulting to 'dateTime' if not provided
  const orderBy = (url.searchParams.get('orderBy') ?? 'dateTime') as keyof Ascent
  // Get the 'page' parameter from the URL, defaulting to 0 if not provided
  const page = Number(url.searchParams.get('page') ?? '1')
  // Set the number of results per page
  const pageSize = 15

  // Query the database for ascents, ordering by the specified field, with pagination
  const ascentsResults = await db((tx) =>
    tx.query.ascents.findMany({
      orderBy: desc(ascents[orderBy]),
      offset: (page - 1) * pageSize,
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
    }),
  )

  // Query the database to get the total count of ascents
  const countResults = await db((tx) => tx.select({ count: count() }).from(ascents))
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
