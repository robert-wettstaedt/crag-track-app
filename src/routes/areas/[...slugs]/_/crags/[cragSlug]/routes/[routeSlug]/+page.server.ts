import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { ascents, routes, crags } from '$lib/db/schema'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { and, desc, eq } from 'drizzle-orm'
import remarkHtml from 'remark-html'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId } = await parent()

  const session = await locals.auth()

  const crag = await db.query.crags.findFirst({
    where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
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

  const route = crag?.routes?.at(0)

  if (route == null) {
    error(404)
  }

  if (crag != null && crag.routes.length > 1) {
    error(400, `Multiple routes with slug ${params.routeSlug} found`)
  }

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

  const enrichedAscents = await Promise.all(
    route.ascents.map(async (ascent) => {
      let notes = ascent.notes

      if (ascent.notes != null) {
        const result = await unified().use(remarkParse).use(remarkHtml).process(ascent.notes)
        notes = result.value as string
      }

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

  return {
    ascents: enrichedAscents,
    route,
    files,
  }
}) satisfies PageServerLoad
