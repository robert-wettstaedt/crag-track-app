import { getStatsOfAreas, getStatsOfBlocks, nestedAreaQuery } from '$lib/blocks.server'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { areas, blocks, files } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { convertException } from '$lib/errors'
import { convertMarkdownToHtml } from '$lib/markdown'
import { loadFiles, searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { getReferences } from '$lib/references.server'
import { error, redirect } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent context
  const { areaSlug, areaId, grades, path, user } = await parent()

  // Query the database for areas with the specified areaId
  const areasResult = await db((tx) =>
    tx.query.areas.findMany({
      where: eq(areas.id, areaId),
      with: {
        author: true, // Include author information
        blocks: {
          orderBy: [blocks.order, blocks.name], // Order blocks by name and order
          with: { routes: true, topos: { with: { file: true } } },
        },
        areas: {
          ...nestedAreaQuery,
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

  if (area.slug !== areaSlug) {
    const newPath = path.map((segment) => segment.replace(`${areaSlug}-${areaId}`, `${area.slug}-${area.id}`))
    redirect(302, `/areas/${newPath.join('/')}`)
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
  const areaFiles = await Promise.all(
    area.files.map(async (file) => {
      try {
        // Search for the file in Nextcloud
        const stat = await searchNextcloudFile(file)

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
    area: {
      ...area,
      areas: getStatsOfAreas(area.areas, grades, user),
      blocks: getStatsOfBlocks(area.blocks, grades, user),
      description,
    },
    blocks: geolocationBlocksResults.map(enrichBlock),
    files: areaFiles,
    references: getReferences(area.id, 'areas'),
  }
}) satisfies PageServerLoad
