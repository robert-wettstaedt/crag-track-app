import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { crags, files } from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId, areaSlug } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const cragsResult = await db.query.crags.findMany({
    where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
    with: {
      files: {
        where: eq(files.type, 'topo'),
      },
    },
  })
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} in ${areaSlug} found`)
  }

  return {
    crag: crag,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const { areaId } = convertAreaSlug(params)

    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const crag = await db.query.crags.findFirst({
      where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
      with: {
        files: {
          where: eq(files.type, 'topo'),
        },
      },
    })

    if (crag == null) {
      error(404)
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
      await db.insert(files).values({ cragFk: crag.id, path, type: 'topo' })
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}`)
  },
}
