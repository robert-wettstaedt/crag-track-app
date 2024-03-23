import { db } from '$lib/db/db.server'
import { boulders } from '$lib/db/schema'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.select().from(boulders)

  return {
    boulders: result,
  }
}) satisfies PageServerLoad
