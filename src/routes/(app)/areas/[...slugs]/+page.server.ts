import { convertException } from '$lib'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { areas, blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { convertMarkdownToHtml } from '$lib/markdown'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { getReferences } from '$lib/references.server'
import { error } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent context
  const { areaId } = await parent()

  // Query the database for areas with the specified areaId
  const areasResult = await db((tx) =>
    tx.query.areas.findMany({
      where: eq(areas.id, areaId),
      with: {
        author: true, // Include author information
        blocks: {
          orderBy: blocks.name, // Order blocks by name
        },
        areas: {
          orderBy: areas.name, // Order nested areas by name
        },
        files: true, // Include files associated with the area
        parkingLocations: true,
      },
    }),
  )

  // Get the last area from the result
  const area = areasResult.at(-1)

  // If no area is found, throw a 404 error
  if (area == null) {
    error(404)
  }

  // Query the database for blocks with geolocation data
  const geolocationBlocksResults = await db((tx) =>
    tx.query.blocks.findMany({
      where: and(isNotNull(blocks.geolocationFk)),
      with: {
        area: buildNestedAreaQuery(), // Include nested area information
        geolocation: true,
      },
    }),
  )

  // Process each file associated with the area
  const files = await Promise.all(
    area.files.map(async (file) => {
      try {
        // Search for the file in Nextcloud
        const stat = await searchNextcloudFile(locals.session, file)

        // Return the file with its stat information
        return { ...file, error: undefined, stat }
      } catch (exception) {
        // If an error occurs, convert the exception and return it with the file
        return { ...file, error: convertException(exception), stat: undefined }
      }
    }),
  )

  // Process area description from markdown to HTML if description is present
  const description = await db(async (tx) =>
    area.description == null ? null : convertMarkdownToHtml(area.description, tx),
  )

  // Return the area, enriched blocks, and processed files
  return {
    area: { ...area, description },
    blocks: geolocationBlocksResults.map(enrichBlock),
    files,
    references: getReferences(area.id, 'areas'),
  }
}) satisfies PageServerLoad
