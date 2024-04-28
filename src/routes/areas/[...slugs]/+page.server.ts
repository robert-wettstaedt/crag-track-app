import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { areas, blocks } from '$lib/db/schema'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
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
    files,
  }
}) satisfies PageServerLoad
