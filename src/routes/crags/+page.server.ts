import { db } from '$lib/db/db.server'
import { crags } from '$lib/db/schema'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.select().from(crags)

  return {
    crags: result,
  }
}) satisfies PageServerLoad
