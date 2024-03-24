import { db } from '$lib/db/db.server'
import { areas } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { MAX_AREA_NESTING_DEPTH } from '$lib/db/utils'

export const load = (async ({ params }) => {
  const path = params.slugs.split('/')
  const slug = path.at(-1)

  if (slug == null) {
    error(404)
  }

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.slug, slug),
    with: {
      author: true,
      crags: true,
      areas: true,
    },
  })

  const area = areasResult.at(-1)

  if (area == null) {
    error(404)
  }

  return {
    area: area as InferResultType<'areas', { areas: true; author: true; crags: true }>,
    canAddArea: path.length < MAX_AREA_NESTING_DEPTH,
  }
}) satisfies PageServerLoad
