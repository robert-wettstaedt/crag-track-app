import { db } from '$lib/db/db.server'
import { ascents, type Ascent } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBoulder } from '$lib/db/utils'
import { count, desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ url }) => {
  const orderBy = (url.searchParams.get('orderBy') ?? 'dateTime') as keyof Ascent
  const page = Number(url.searchParams.get('page') ?? '0')
  const pageSize = 15

  const ascentsResults = await db.query.ascents.findMany({
    orderBy: desc(ascents[orderBy]),
    offset: page * pageSize,
    limit: pageSize,
    with: {
      author: true,
      boulder: {
        with: {
          crag: {
            with: {
              area: buildNestedAreaQuery(),
            },
          },
        },
      },
    },
  })

  const countResults = await db.select({ count: count() }).from(ascents)
  const enrichedAscents = ascentsResults.map((ascent) => ({ ...ascent, boulder: enrichBoulder(ascent.boulder) }))

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
