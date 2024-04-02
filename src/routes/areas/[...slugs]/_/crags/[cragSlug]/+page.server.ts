import { db } from '$lib/db/db.server'
import { crags } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichCrag } from '$lib/db/utils'
import { getFileContents } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()

  const cragsResult = await db.query.crags.findMany({
    where: eq(crags.slug, params.cragSlug),
    with: {
      author: true,
      boulders: true,
      files: true,
    },
  })
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} found`)
  }

  const result = await db.query.crags.findMany({
    where: and(isNotNull(crags.lat), isNotNull(crags.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  const filePromises = crag.files.map(async (file) => {
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
    crag: crag,
    crags: result.map(enrichCrag),
    files: Promise.all(filePromises),
  }
}) satisfies PageServerLoad
