import { getStatsOfAreas, nestedAreaQuery } from '$lib/blocks.server'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { areas } from '$lib/db/schema'
import { isNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const { grades, user } = await parent()
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Query the database to find areas where the parentFk is null, ordered by name
  const result = await db((tx) =>
    tx.query.areas.findMany({
      ...nestedAreaQuery,
      orderBy: areas.name,
      where: isNull(areas.parentFk),
    }),
  )

  // Return the result as an object with an 'areas' property
  return {
    areas: getStatsOfAreas(result, grades, user),
  }
}) satisfies PageServerLoad
