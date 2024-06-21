import { db } from '$lib/db/db.server'
import { blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { and, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  // Query the database to find blocks with non-null latitude and longitude
  const result = await db.query.blocks.findMany({
    where: and(isNotNull(blocks.geolocationFk)),
    // Include nested area information in the query result
    with: {
      area: buildNestedAreaQuery(),
      geolocation: true,
    },
  })

  // Return the blocks after enriching them with additional data
  return {
    blocks: result.map(enrichBlock),
  }
}) satisfies PageServerLoad
