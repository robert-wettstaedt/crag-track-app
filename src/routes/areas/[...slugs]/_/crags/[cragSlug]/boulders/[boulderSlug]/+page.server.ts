import { db } from '$lib/db/db.server'
import { ascents, boulders } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { desc, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const bouldersResult = await db.query.boulders.findMany({
    where: eq(boulders.slug, params.boulderSlug),
    with: {
      author: true,
      ascents: {
        orderBy: desc(ascents.dateTime),
        with: {
          author: true,
          parentBoulder: true,
        },
      },
    },
  })
  const boulder = bouldersResult.at(0)

  if (boulder == null) {
    error(404)
  }

  if (bouldersResult.length > 1) {
    error(400, `Multiple boulders with slug ${params.boulderSlug} found`)
  }

  return {
    boulder,
  }
}) satisfies PageServerLoad
