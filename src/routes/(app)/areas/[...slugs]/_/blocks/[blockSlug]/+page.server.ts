import { db } from '$lib/db/db.server'
import { blocks, files, routes } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock, enrichTopo } from '$lib/db/utils'
import { loadFiles } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { and, eq, isNotNull, not } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug } = await parent()
  // Get the current session from locals
  const session = await locals.auth()

  // Query the database for blocks matching the given slug and areaId
  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    with: {
      author: true,
      geolocation: true,
      routes: {
        orderBy: routes.grade,
      },
      files: {
        where: not(eq(files.type, 'topo')),
      },
      topos: {
        with: {
          file: true,
          routes: true,
        },
      },
    },
  })

  // Get the first block from the result
  const block = blocksResult.at(0)

  // If no block is found, throw a 404 error
  if (block == null) {
    error(404)
  }

  // If more than one block is found, throw a 400 error
  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  // Query the database for blocks with geolocation data
  const geolocationBlocksResults = await db.query.blocks.findMany({
    where: and(isNotNull(blocks.geolocationFk)),
    with: {
      area: buildNestedAreaQuery(),
      geolocation: true,
    },
  })

  const blockFiles = await loadFiles(block.files, session)
  const topos = await Promise.all(block.topos.map((topo) => enrichTopo(topo, session)))

  // Return the block, enriched geolocation blocks, and processed files
  return {
    block,
    blocks: geolocationBlocksResults.map(enrichBlock),
    files: blockFiles,
    topos,
  }
}) satisfies PageServerLoad
