import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { routes, crags, files, type File } from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const crag = await db.query.crags.findFirst({
    where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
    with: {
      routes: {
        where: eq(routes.slug, params.routeSlug),
        with: {
          files: {
            where: eq(files.type, 'topo'),
          },
        },
      },
    },
  })

  const route = crag?.routes?.at(0)

  if (route == null) {
    error(404)
  }

  if (crag != null && crag.routes.length > 1) {
    error(400, `Multiple routes with slug ${params.routeSlug} found`)
  }

  return {
    route,
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
    const type = data.get('type')

    const values = { path, type }

    const crag = await db.query.crags.findFirst({
      where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
      with: {
        routes: {
          where: eq(routes.slug, params.routeSlug),
        },
      },
    })

    const route = crag?.routes?.at(0)

    if (route == null) {
      return fail(404, { ...values, error: `Route not found ${params.routeSlug}` })
    }

    if (crag != null && crag.routes.length > 1) {
      return fail(400, { ...values, error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    if (typeof path !== 'string' || path.length === 0) {
      return fail(400, { ...values, error: 'path is required' })
    }

    if (typeof type !== 'string' || type.length === 0) {
      return fail(400, { ...values, error: 'type is required' })
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
      await db.insert(files).values({
        routeFk: route.id,
        cragFk: type === 'topo' ? crag?.id : undefined,
        path,
        type: type as File['type'],
      })
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}/routes/${route.slug}`)
  },
}
