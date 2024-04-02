import { db } from '$lib/db/db.server'
import { crags, files } from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const cragsResult = await db.query.crags.findMany({
    where: eq(crags.slug, params.cragSlug),
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
    error(400, `Multiple crags with slug ${params.cragSlug} found`)
  }

  return {
    crag: crag,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const cragsResult = await db.query.crags.findMany({
      where: eq(crags.slug, params.cragSlug),
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
      error(400, `Multiple crags with slug ${params.cragSlug} found`)
    }

    const data = await request.formData()
    const path = data.get('path')
    const values = { path }

    if (typeof path !== 'string' || path.length === 0) {
      return fail(400, { ...values, error: 'path is required' })
    }

    let stat: FileStat | undefined = undefined
    try {
      stat = (await getNextcloud(session)?.stat(path)) as FileStat | undefined
    } catch (error) {
      if (error instanceof Error) {
        return fail(400, { ...values, error: error.message })
      }

      return fail(400, { ...values, error: String(error) })
    }

    if (stat == null) {
      return fail(400, { ...values, error: 'Unable to read file' })
    }

    if (stat.type === 'directory') {
      return fail(400, { ...values, error: 'path must be a file not a directory' })
    }

    try {
      await db.insert(files).values({ cragFk: crag.id, mime: stat.mime, path, type: 'topo' })
    } catch (error) {
      if (error instanceof Error) {
        return fail(404, { ...values, error: error.message })
      }

      return fail(404, { ...values, error: String(error) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}`)
  },
}
