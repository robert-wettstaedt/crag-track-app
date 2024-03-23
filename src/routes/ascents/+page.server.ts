import { db } from '$lib/db/db.server'
import { ascents, boulders } from '$lib/db/schema'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.select().from(ascents).innerJoin(boulders, eq(ascents.boulder, boulders.id))

  return {
    ascents: result.map((item) => ({
      ascent: item.ascents,
      boulder: item.boulders,
    })),
  }
}) satisfies PageServerLoad
