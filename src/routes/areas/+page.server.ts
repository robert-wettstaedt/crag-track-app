import { db } from '$lib/db/db.server'
import { areas } from '$lib/db/schema'
import { isNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  // Query the database to find areas where the parentFk is null, ordered by name
  const result = await db.query.areas.findMany({ where: isNull(areas.parentFk), orderBy: areas.name })

  // Return the result as an object with an 'areas' property
  return {
    areas: result,
  }
}) satisfies PageServerLoad
