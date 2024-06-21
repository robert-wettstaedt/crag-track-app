import { db } from '$lib/db/db.server'
import { areas, blocks } from '$lib/db/schema'
import { enrichTopo } from '$lib/db/utils'
import { convertAreaSlug } from '$lib/helper.server'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()

  const { areaId } = convertAreaSlug(params)

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      author: true,
      blocks: {
        orderBy: blocks.name,
        with: {
          routes: {
            with: {
              firstAscent: {
                with: {
                  climber: true,
                },
              },
            },
          },
          topos: {
            with: {
              file: true,
              routes: true,
            },
          },
        },
      },
      areas: {
        orderBy: areas.name,
      },
    },
  })

  // Get the last area from the result
  const area = areasResult.at(-1)

  // If no area is found, throw a 404 error
  if (area == null) {
    error(404)
  }

  const _blocks = await Promise.all(
    area.blocks.map(async (block) => {
      const toposResult = await Promise.all(block.topos.map((topo) => enrichTopo(topo, session)))

      return {
        ...block,
        topos: toposResult,
      }
    }),
  )

  return {
    area: {
      ...area,
      blocks: _blocks,
    },
  }
}) satisfies PageServerLoad
