import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { ascents, boulders, crags } from '$lib/db/schema'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { desc, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkHtml from 'remark-html'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()

  const crag = await db.query.crags.findFirst({
    where: eq(crags.slug, params.cragSlug),
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
            },
          },
          files: {
            with: {
              ascent: true,
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
      if (ascent.notes == null) {
        return ascent
      }

      const result = await unified().use(remarkParse).use(remarkHtml).process(ascent.notes)

      return {
        ...ascent,
        notes: result.value as string,
      }
    }),
  )

  return {
    ascents: enrichedAscents,
    boulder,
    files,
  }
}) satisfies PageServerLoad
