import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { routes, blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
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
      routes: {
        orderBy: routes.grade,
      },
      files: true,
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
    where: and(isNotNull(blocks.lat), isNotNull(blocks.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  // Process each file associated with the block
  const files = await Promise.all(
    block.files.map(async (file) => {
      try {
        // Search for the file in Nextcloud and return its stats
        const stat = await searchNextcloudFile(session, file)
        return { ...file, error: undefined, stat }
      } catch (exception) {
        // If an error occurs, convert the exception and return it
        return { ...file, error: convertException(exception), stat: undefined }
      }
    }),
  )

  // Return the block, enriched geolocation blocks, and processed files
  return {
    block,
    blocks: geolocationBlocksResults.map(enrichBlock),
    files,
  }
}) satisfies PageServerLoad
