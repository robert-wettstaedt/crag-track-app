import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { ascents, boulders, crags } from '$lib/db/schema'
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
      boulders: {
        where: eq(boulders.slug, params.boulderSlug),
        with: {
          author: true,
          ascents: {
            orderBy: desc(ascents.dateTime),
            with: {
              author: true,
              boulder: true,
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

  const boulder = crag?.boulders?.at(0)

  if (boulder == null) {
    error(404)
  }

  if (crag != null && crag.boulders.length > 1) {
    error(400, `Multiple boulders with slug ${params.boulderSlug} found`)
  }

  const files = await Promise.all(
    boulder.files.map(async (file) => {
      try {
        const stat = await searchNextcloudFile(session, file)

        return { ...file, error: undefined, stat }
      } catch (exception) {
        return { ...file, error: convertException(exception), stat: undefined }
      }
    }),
  )

  const enrichedAscents = await Promise.all(
    boulder.ascents.map(async (ascent) => {
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
    boulder,
    files,
  }
}) satisfies PageServerLoad
