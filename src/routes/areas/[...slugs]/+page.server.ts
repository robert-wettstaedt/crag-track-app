import { db } from '$lib/db/db.server'
import { areas, blocks } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ parent }) => {
  const { areaId } = await parent()

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      author: true,
      blocks: {
        orderBy: blocks.name,
      },
      areas: {
        orderBy: areas.name,
      },
    },
  })

  const area = areasResult.at(-1)

  if (area == null) {
    error(404)
  }

  return {
    area,
  }
}) satisfies PageServerLoad
