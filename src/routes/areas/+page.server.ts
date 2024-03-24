import { db } from '$lib/db/db.server'
import { areas } from '$lib/db/schema'
import { isNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.select().from(areas).where(isNull(areas.parent))

  return {
    areas: result,
  }
}) satisfies PageServerLoad
