import { db } from '$lib/db/db.server'
import { crags } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const cragsResult = await db.query.crags.findMany({
    where: eq(crags.slug, params.cragSlug),
    with: {
      author: true,
      boulders: true,
    },
  })
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} found`)
  }

  return {
    crag: crag as InferResultType<'crags', { author: true; boulders: true }>,
  }
}) satisfies PageServerLoad
