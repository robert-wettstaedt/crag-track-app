import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { areas, crags, generateSlug, users } from '$lib/db/schema'
import { validateCragForm, type CragActionFailure, type CragActionValues } from '$lib/forms.server.js'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const { areaId } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const areaResult = await db.query.areas.findFirst({ where: eq(areas.id, areaId) })

  if (areaResult == null) {
    error(404)
  }

  return {
    area: areaResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user?.email == null) {
      error(401)
    }

    const data = await request.formData()
    let values: CragActionValues

    try {
      values = await validateCragForm(data)
    } catch (exception) {
      return exception as CragActionFailure
    }

    const slug = generateSlug(values.name)

    const { areaId, path } = convertAreaSlug(params)

    const existingCragsResult = await db.query.crags.findFirst({
      where: and(eq(crags.slug, slug), eq(crags.areaFk, areaId)),
    })

    if (existingCragsResult != null) {
      return fail(400, {
        ...values,
        error: `Crag with name "${existingCragsResult.name}" already exists in area "${parent.name}"`,
      })
    }

    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      await db.insert(crags).values({ ...values, createdBy: user.id, areaFk: areaId, slug })
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    const mergedPath = ['areas', ...path, '_', 'crags', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
