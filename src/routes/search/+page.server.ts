import { db } from '$lib/db/db.server'
import { like, or } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { areas, boulders, crags, users } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichArea, enrichBoulder, enrichCrag } from '$lib/db/utils'

export const load = (async ({ url }) => {
  const query = url.searchParams.get('q')

  if (query == null || query.length < 3) {
    return
  }

  const searchString = `%${query}%`

  const areasResult = await db.query.areas.findMany({
    where: like(areas.name, searchString),
    with: {
      parentArea: buildNestedAreaQuery(),
    },
  })

  const cragsResult = await db.query.crags.findMany({
    where: like(crags.name, searchString),
    with: {
      parentArea: buildNestedAreaQuery(),
    },
  })

  const bouldersResult = await db.query.boulders.findMany({
    where: like(boulders.name, searchString),
    with: {
      parentCrag: {
        with: {
          parentArea: buildNestedAreaQuery(),
        },
      },
    },
  })

  const usersResult = await db.query.users.findMany({
    where: or(like(users.email, searchString), like(users.userName, searchString)),
  })

  return {
    searchResults: {
      boulders: bouldersResult.map(enrichBoulder),
      crags: cragsResult.map(enrichCrag),
      areas: areasResult.map(enrichArea),
      users: usersResult,
    },
  }
}) satisfies PageServerLoad