import { db } from '$lib/db/db.server'
import { boulders, crags, files, type Crag, type File } from '$lib/db/schema'
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

  const bouldersResult = await db.query.boulders.findMany({
    where: eq(boulders.slug, params.boulderSlug),
    with: {
      files: {
        where: eq(files.type, 'topo'),
      },
    },
  })
  const boulder = bouldersResult.at(0)

  if (boulder == null) {
    error(404)
  }

  if (bouldersResult.length > 1) {
    error(400, `Multiple boulders with slug ${params.boulderSlug} found`)
  }

  return {
    boulder: boulder,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const data = await request.formData()

    const path = data.get('path')
    const type = data.get('type')

    const values = { path, type }

    const bouldersResult = await db.query.boulders.findMany({
      where: eq(boulders.slug, params.boulderSlug),
      with: {
        files: true,
      },
    })
    const boulder = bouldersResult.at(0)

    if (boulder == null) {
      return fail(404, values)
    }

    if (bouldersResult.length > 1) {
      return fail(400, { error: `Multiple boulders with slug ${params.boulderSlug} found` })
    }

    if (typeof path !== 'string' || path.length === 0) {
      return fail(400, { ...values, error: 'path is required' })
    }

    if (typeof type !== 'string' || type.length === 0) {
      return fail(400, { ...values, error: 'type is required' })
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

    let crag: Crag | undefined

    if (type === 'topo') {
      const cragsResult = await db.query.crags.findMany({ where: eq(crags.slug, params.cragSlug) })
      crag = cragsResult.at(0)

      if (crag == null) {
        return fail(404, values)
      }

      if (cragsResult.length > 1) {
        return fail(400, { error: `Multiple crags with slug ${params.cragSlug} found` })
      }
    }

    try {
      await db
        .insert(files)
        .values({ boulderFk: boulder.id, cragFk: crag?.id, mime: stat.mime, path, type: type as File['type'] })
    } catch (error) {
      if (error instanceof Error) {
        return fail(404, { ...values, error: error.message })
      }

      return fail(404, { ...values, error: String(error) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}/boulders/${boulder.slug}`)
  },
}
