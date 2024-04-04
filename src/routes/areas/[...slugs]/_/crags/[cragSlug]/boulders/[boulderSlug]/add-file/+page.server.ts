import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { boulders, crags, files, type File } from '$lib/db/schema'
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

  const crag = await db.query.crags.findFirst({
    where: eq(crags.slug, params.cragSlug),
    with: {
      boulders: {
        where: eq(boulders.slug, params.boulderSlug),
        with: {
          files: {
            where: eq(files.type, 'topo'),
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

    const crag = await db.query.crags.findFirst({
      where: eq(crags.slug, params.cragSlug),
      with: {
        boulders: {
          where: eq(boulders.slug, params.boulderSlug),
        },
      },
    })

    const boulder = crag?.boulders?.at(0)

    if (boulder == null) {
      return fail(404, values)
    }

    if (crag != null && crag.boulders.length > 1) {
      return fail(400, { ...values, error: `Multiple boulders with slug ${params.boulderSlug} found` })
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
      await db.insert(files).values({
        boulderFk: boulder.id,
        cragFk: type === 'topo' ? crag?.id : undefined,
        mime: stat.mime,
        path,
        type: type as File['type'],
      })
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}/boulders/${boulder.slug}`)
  },
}
