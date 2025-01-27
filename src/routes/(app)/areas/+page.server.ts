import { getStatsOfArea, nestedAreaQuery } from '$lib/blocks.server'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { areas } from '$lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const { grades, user } = await parent()
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Query the database to find areas where the parentFk is null, ordered by name
  const areaResults = await db((tx) =>
    tx.query.areas.findMany({
      ...nestedAreaQuery,
      orderBy: areas.name,
      where: and(isNull(areas.parentFk), eq(areas.visibility, 'public')),
    }),
  )

  // Return the result as an object with an 'areas' property
  return {
    areas: areaResults.map((area) => getStatsOfArea(area, grades, user)),
  }
}) satisfies PageServerLoad
