import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { areas } from '$lib/db/schema'
import { validateCragForm, type CragActionFailure, type CragActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const { areaId } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const areasResult = await db.query.areas.findMany({ where: eq(areas.id, areaId) })
  const area = areasResult.at(0)

  if (area == null) {
    error(404)
  }

  return {
    name: area.name,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const data = await request.formData()
    let values: CragActionValues

    try {
      values = await validateCragForm(data)
    } catch (exception) {
      return exception as CragActionFailure
    }

    const { areaId } = convertAreaSlug(params)

    try {
      await db.update(areas).set(values).where(eq(areas.id, areaId))
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}`)
  },
}
