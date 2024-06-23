import { db } from '$lib/db/db.server'
import { areas, blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock, enrichTopo } from '$lib/db/utils'
import { convertAreaSlug } from '$lib/helper.server'
import { error } from '@sveltejs/kit'
import { desc, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

const blocksQuery: {
  area: Parameters<typeof db.query.areas.findMany>[0]
  geolocation: true
  routes: {
    with: {
      firstAscent: {
        with: {
          climber: true
        }
      }
      tags: true
    }
  }
  topos: {
    with: {
      file: true
      routes: true
    }
  }
} = {
  area: buildNestedAreaQuery(2),
  geolocation: true,
  routes: {
    with: {
      firstAscent: {
        with: {
          climber: true,
        },
      },
      tags: true,
    },
  },
  topos: {
    with: {
      file: true,
      routes: true,
    },
  },
}

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()

  const { areaId } = convertAreaSlug(params)

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      author: true,
      blocks: {
        orderBy: blocks.name,
        with: blocksQuery,
      },
      areas: {
        orderBy: desc(areas.createdAt),
        with: {
          blocks: {
            orderBy: blocks.name,
            with: blocksQuery,
          },
        },
      },
      parkingLocations: true,
    },
  })

  // Get the last area from the result
  const area = areasResult.at(-1)

  // If no area is found, throw a 404 error
  if (area == null) {
    error(404)
  }

  const allBlocks = [...area.blocks, ...area.areas.flatMap((area) => area.blocks)]

  const enrichedBlocks = await Promise.all(
    allBlocks.map(async (block) => {
      const toposResult = await Promise.all(block.topos.map((topo) => enrichTopo(topo, session)))
      const enrichedBlock = enrichBlock(block)

      return {
        ...block,
        ...enrichedBlock,
        topos: toposResult,
      }
    }),
  )

  return {
    area: {
      ...area,
      blocks: enrichedBlocks,
      areas: area.areas.map((area) => {
        return {
          ...area,
          blocks: enrichedBlocks.filter((block) => block.areaFk === area.id),
        }
      }),
    },
    session,
  }
}) satisfies PageServerLoad
