import * as schema from '$lib/db/schema'
import { areas, blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock, enrichTopo } from '$lib/db/utils'
import type { Session } from '@auth/sveltekit'
import { error } from '@sveltejs/kit'
import { eq, isNotNull } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'

export const getBlocksOfArea = async (areaId: number, db: BetterSQLite3Database<typeof schema>) => {
  const blocksQuery: {
    area: Parameters<typeof db.query.areas.findMany>[0]
    geolocation: true
    routes: true
  } = {
    area: buildNestedAreaQuery(2),
    geolocation: true,
    routes: true,
  }

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      author: true,
      blocks: {
        orderBy: blocks.name,
        where: isNotNull(blocks.geolocationFk),
        with: blocksQuery,
      },
      areas: {
        orderBy: areas.name,
        with: {
          author: true,
          blocks: {
            orderBy: blocks.name,
            where: isNotNull(blocks.geolocationFk),
            with: blocksQuery,
          },
          areas: {
            orderBy: areas.name,
            with: {
              blocks: {
                orderBy: blocks.name,
                where: isNotNull(blocks.geolocationFk),
                with: blocksQuery,
              },
            },
          },
          parkingLocations: true,
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

  const allBlocks = [
    ...area.blocks,
    ...area.areas.flatMap((area) => area.blocks),
    ...area.areas.flatMap((area) => area.areas).flatMap((area) => area.blocks),
  ]

  const enrichedBlocks = allBlocks
    .filter((block) => block.geolocation != null)
    .map((block) => {
      const enrichedBlock = enrichBlock(block)

      return {
        ...block,
        ...enrichedBlock,
      }
    })

  return { area, blocks: enrichedBlocks }
}

export const getToposOfArea = async (
  areaId: number,
  db: BetterSQLite3Database<typeof schema>,
  session?: Session | null,
) => {
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

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      author: true,
      blocks: {
        orderBy: blocks.name,
        where: isNotNull(blocks.geolocationFk),
        with: blocksQuery,
      },
      areas: {
        orderBy: areas.name,
        with: {
          blocks: {
            orderBy: blocks.name,
            where: isNotNull(blocks.geolocationFk),
            with: blocksQuery,
          },
          areas: {
            orderBy: areas.name,
            with: {
              blocks: {
                orderBy: blocks.name,
                where: isNotNull(blocks.geolocationFk),
                with: blocksQuery,
              },
              parkingLocations: true,
            },
          },
          parkingLocations: true,
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

  const allBlocks = [
    ...area.blocks,
    ...area.areas.flatMap((area) => area.blocks),
    ...area.areas.flatMap((area) => area.areas).flatMap((area) => area.blocks),
  ]

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
    area,
    blocks: enrichedBlocks,
    areas: area.areas.map((area) => {
      return {
        ...area,
        blocks: enrichedBlocks.filter((block) => block.areaFk === area.id),
      }
    }),
  }
}
