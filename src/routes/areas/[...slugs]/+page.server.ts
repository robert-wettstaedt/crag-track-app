import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { areas, blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const { areaId } = await parent()
  const session = await locals.auth()

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      author: true,
      blocks: {
        orderBy: blocks.name,
      },
      areas: {
        orderBy: areas.name,
      },
      files: true,
    },
  })

  const area = areasResult.at(-1)

  if (area == null) {
    error(404)
  }

  const geolocationBlocksResults = await db.query.blocks.findMany({
    where: and(isNotNull(blocks.lat), isNotNull(blocks.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  const files = await Promise.all(
    area.files.map(async (file) => {
      try {
        const stat = await searchNextcloudFile(session, file)

        return { ...file, error: undefined, stat }
      } catch (exception) {
        return { ...file, error: convertException(exception), stat: undefined }
      }
    }),
  )

  return {
    area,
    blocks: geolocationBlocksResults.map(enrichBlock),
    files,
  }
}) satisfies PageServerLoad
