import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { routes, crags } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichCrag } from '$lib/db/utils'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId, areaSlug } = await parent()
  const session = await locals.auth()

  const cragsResult = await db.query.crags.findMany({
    where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
    with: {
      author: true,
      routes: {
        orderBy: routes.grade,
      },
      files: true,
    },
  })
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} in ${areaSlug} found`)
  }

  const geolocationCragsResults = await db.query.crags.findMany({
    where: and(isNotNull(crags.lat), isNotNull(crags.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  const files = await Promise.all(
    crag.files.map(async (file) => {
      try {
        const stat = await searchNextcloudFile(session, file)

        return { ...file, error: undefined, stat }
      } catch (exception) {
        return { ...file, error: convertException(exception), stat: undefined }
      }
    }),
  )

  return {
    crag: crag,
    crags: geolocationCragsResults.map(enrichCrag),
    files,
  }
}) satisfies PageServerLoad
