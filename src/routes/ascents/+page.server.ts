import { db } from '$lib/db/db.server'
import { ascents } from '$lib/db/schema'
import { desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.query.ascents.findMany({
    orderBy: desc(ascents.dateTime),
    with: {
      author: true,
      parentBoulder: true,
    },
  })

  return {
    ascents: result,
  }
}) satisfies PageServerLoad
