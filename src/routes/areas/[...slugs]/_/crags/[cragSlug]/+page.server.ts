import { db } from '$lib/db/db.server'
import { boulders, crags } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichCrag } from '$lib/db/utils'
import { error } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const cragsResult = await db.query.crags.findMany({
    where: eq(crags.slug, params.cragSlug),
    with: {
      author: true,
      boulders: {
        orderBy: boulders.grade,
      },
      files: true,
    },
  })
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} found`)
  }

  const result = await db.query.crags.findMany({
    where: and(isNotNull(crags.lat), isNotNull(crags.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  return {
    crag: crag,
    crags: result.map(enrichCrag),
  }
}) satisfies PageServerLoad
