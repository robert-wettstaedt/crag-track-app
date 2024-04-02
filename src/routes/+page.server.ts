import { db } from '$lib/db/db.server'
import { crags } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichCrag } from '$lib/db/utils'
import { and, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.query.crags.findMany({
    where: and(isNotNull(crags.lat), isNotNull(crags.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  return {
    crags: result.map(enrichCrag),
  }
}) satisfies PageServerLoad
