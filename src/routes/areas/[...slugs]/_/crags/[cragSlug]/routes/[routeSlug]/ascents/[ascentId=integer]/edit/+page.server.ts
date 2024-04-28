import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { ascents, crags, files, routes, users, type Ascent, type File } from '$lib/db/schema'
import { validateAscentForm, type AscentActionFailure, type AscentActionValues } from '$lib/forms.server'
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
      },
    },
  })

  const route = crag?.routes?.at(0)

  if (route == null) {
    error(404)
  }

  if (crag != null && crag.routes.length > 1) {
    error(400, `Multiple route with slug ${params.routeSlug} found`)
  }

  const ascent = await db.query.ascents.findFirst({
    where: eq(ascents.id, Number(params.ascentId)),
    with: {
      author: true,
      files: true,
    },
  })

  if (ascent == null) {
    error(404)
  }

  if (session.user.email !== ascent.author.email) {
    error(401)
  }

  return {
    ascent,
    route,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const { areaId } = convertAreaSlug(params)

    const session = await locals.auth()
    if (session?.user?.email == null) {
      error(401)
    }

    const data = await request.formData()
    let values: AscentActionValues

    try {
      values = await validateAscentForm(data)
    } catch (exception) {
      return exception as AscentActionFailure
    }

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

    let hasFiles = false
    if (values.filePaths != null) {
      try {
        await Promise.all(
          values.filePaths
            .filter((filePath) => filePath.trim().length > 0)
            .map(async (filePath) => {
              hasFiles = true
              const stat = (await getNextcloud(session)?.stat(session.user!.email + filePath)) as FileStat | undefined

              if (stat == null) {
                throw `Unable to read file: "${filePath}"`
              }

              if (stat.type === 'directory') {
                throw `path must be a file not a directory: "${filePath}"`
              }
            }),
        )
      } catch (exception) {
        return fail(400, { ...values, error: convertException(exception) })
      }
    }

    let ascent: Ascent
    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      const results = await db
        .update(ascents)
        .set({ ...values, routeFk: route.id, createdBy: user.id })
        .where(eq(ascents.id, Number(params.ascentId)))
        .returning()
      ascent = results[0]
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    if (hasFiles) {
      try {
        const fileType: File['type'] = values.type === 'flash' ? 'send' : values.type

        await db.delete(files).where(eq(files.ascentFk, ascent.id))

        await db.insert(files).values(
          values
            .filePaths!.filter((filePath) => filePath.trim().length > 0)
            .map((filePath) => ({
              ascentFk: ascent.id,
              path: filePath,
              type: fileType,
            })),
        )
      } catch (exception) {
        return fail(400, { ...values, error: convertException(exception) })
      }
    }

    const mergedPath = ['areas', params.slugs, '_', 'crags', params.cragSlug, 'routes', params.routeSlug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
