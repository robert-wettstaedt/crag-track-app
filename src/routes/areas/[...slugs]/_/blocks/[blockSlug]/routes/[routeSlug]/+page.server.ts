import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { ascents, blocks, routes } from '$lib/db/schema'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { and, desc, eq } from 'drizzle-orm'
import remarkHtml from 'remark-html'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Authenticate the session
  const session = await locals.auth()

  // Query the database to find the block and its associated routes
  const block = await db.query.blocks.findFirst({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    with: {
      routes: {
        where: eq(routes.slug, params.routeSlug),
        with: {
          author: true,
          ascents: {
            orderBy: desc(ascents.dateTime),
            with: {
              author: true,
              route: true,
              files: true,
            },
          },
          files: true,
          firstAscent: {
            with: {
              climber: true,
            },
          },
        },
      },
    },
  })

  // Get the first route from the block's routes
  const route = block?.routes?.at(0)

  // Handle case where route is not found
  if (route == null) {
    error(404)
  }

  // Handle case where multiple routes with the same slug are found
  if (block != null && block.routes.length > 1) {
    error(400, `Multiple routes with slug ${params.routeSlug} found`)
  }

  // Fetch and enrich files associated with the route
  const files = await Promise.all(
    route.files.map(async (file) => {
      try {
        const stat = await searchNextcloudFile(session, file)
        return { ...file, error: undefined, stat }
      } catch (exception) {
        return { ...file, error: convertException(exception), stat: undefined }
      }
    }),
  )

  // Enrich ascents with additional data and process notes
  const enrichedAscents = await Promise.all(
    route.ascents.map(async (ascent) => {
      let notes = ascent.notes

      // Convert ascent notes from markdown to HTML if notes are present
      if (ascent.notes != null) {
        const result = await unified().use(remarkParse).use(remarkHtml).process(ascent.notes)
        notes = result.value as string
      }

      // Fetch and enrich files associated with the ascent
      const files = await Promise.all(
        ascent.files
          .toSorted((a, b) => a.path.localeCompare(b.path))
          .map(async (file) => {
            try {
              const stat = await searchNextcloudFile(session, file)
              return { ...file, error: undefined, stat }
            } catch (exception) {
              return { ...file, error: convertException(exception), stat: undefined }
            }
          }),
      )

      return {
        ...ascent,
        notes,
        files,
      }
    }),
  )

  // Process route description from markdown to HTML if description is present
  let description = route.description
  if (description != null) {
    const result = await unified().use(remarkParse).use(remarkHtml).process(description)
    description = result.value as string
  }

  // Return the enriched data
  return {
    ascents: enrichedAscents,
    route: { ...route, description },
    files,
  }
}) satisfies PageServerLoad
