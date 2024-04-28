import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { areas, files } from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const { areaId } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      files: true,
    },
  })

  const area = areasResult.at(-1)

  if (area == null) {
    error(404)
  }

  return {
    area,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const { areaId } = convertAreaSlug(params)

    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const data = await request.formData()
    const path = data.get('path')
    const values = { path }

    if (typeof path !== 'string' || path.length === 0) {
      return fail(400, { ...values, error: 'path is required' })
    }

    let stat: FileStat | undefined = undefined
    try {
      stat = (await getNextcloud(session)?.stat(session.user.email + path)) as FileStat | undefined
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    if (stat == null) {
      return fail(400, { ...values, error: 'Unable to read file' })
    }

    if (stat.type === 'directory') {
      return fail(400, { ...values, error: 'path must be a file not a directory' })
    }

    try {
      await db.insert(files).values({ areaFk: areaId, path, type: 'topo' })
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}`)
  },
}
