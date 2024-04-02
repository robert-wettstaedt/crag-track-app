import { db } from '$lib/db/db.server'
import { ascents, boulders, crags } from '$lib/db/schema'
import { getFileContents } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { desc, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

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

  const filePromises = boulder.files.map(async (file) => {
    try {
      return {
        content: await getFileContents(session, file),
        info: file,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        info: file,
      }
    }
  })

  return {
    boulder,
    files: Promise.all(filePromises),
  }
}) satisfies PageServerLoad
