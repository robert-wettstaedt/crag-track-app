import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Query the database to find blocks with non-null latitude and longitude
  const result = await db((tx) =>
    tx.query.blocks.findMany({
      where: isNotNull(blocks.geolocationFk),
      // Include nested area information in the query result
      with: {
        area: buildNestedAreaQuery(),
        geolocation: true,
      },
    }),
  )

  // Return the blocks after enriching them with additional data
  return {
    blocks: result.map(enrichBlock),
  }
}) satisfies PageServerLoad
