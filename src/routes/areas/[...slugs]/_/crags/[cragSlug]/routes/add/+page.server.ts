import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { routes, crags, generateSlug, users } from '$lib/db/schema'
import { validateRouteForm, type RouteActionFailure, type RouteActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId, areaSlug } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const cragsResult = await db.query.crags.findMany({
    where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
  })
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} in ${areaSlug} found`)
  }

  return {
    crag,
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
    let values: RouteActionValues
    const { path } = convertAreaSlug(params)

    try {
      values = await validateRouteForm(data)
    } catch (exception) {
      return exception as RouteActionFailure
    }

    const slug = generateSlug(values.name)

    const crag = await db.query.crags.findFirst({
      where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
    })

    if (crag == null) {
      return fail(400, { ...values, error: `Parent not found ${params.cragSlug}` })
    }

    const existingRoutesResult = await db
      .select()
      .from(routes)
      .where(and(eq(routes.slug, slug), eq(routes.cragFk, crag.id)))

    if (existingRoutesResult.length > 0) {
      return fail(400, {
        ...values,
        error: `Route with name "${existingRoutesResult[0].name}" already exists in crag "${crag.name}"`,
      })
    }

    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      await db.insert(routes).values({ ...values, createdBy: user.id, cragFk: crag.id, slug })
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    const mergedPath = ['areas', ...path, '_', 'crags', params.cragSlug, 'routes', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
