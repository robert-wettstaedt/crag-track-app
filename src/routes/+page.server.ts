import { db } from '$lib/db/db.server'
import { blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { and, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.query.blocks.findMany({
    where: and(isNotNull(blocks.lat), isNotNull(blocks.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  return {
    blocks: result.map(enrichBlock),
  }
}) satisfies PageServerLoad
