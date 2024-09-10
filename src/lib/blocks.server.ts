import { areas, blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './db/schema'

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
        with: blocksQuery,
      },
      areas: {
        orderBy: areas.name,
        with: {
          author: true,
          blocks: {
            orderBy: blocks.name,
            with: blocksQuery,
          },
          areas: {
            orderBy: areas.name,
            with: {
              blocks: {
                orderBy: blocks.name,
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
