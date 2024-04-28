import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { routes, blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId, areaSlug } = await parent()
  const session = await locals.auth()

  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    with: {
      author: true,
      routes: {
        orderBy: routes.grade,
      },
      files: true,
    },
  })
  const block = blocksResult.at(0)

  if (block == null) {
    error(404)
  }

  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  const geolocationBlocksResults = await db.query.blocks.findMany({
    where: and(isNotNull(blocks.lat), isNotNull(blocks.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  const files = await Promise.all(
    block.files.map(async (file) => {
      try {
        const stat = await searchNextcloudFile(session, file)

        return { ...file, error: undefined, stat }
      } catch (exception) {
        return { ...file, error: convertException(exception), stat: undefined }
      }
    }),
  )

  return {
    block: block,
    blocks: geolocationBlocksResults.map(enrichBlock),
    files,
  }
}) satisfies PageServerLoad
