import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { crags } from '$lib/db/schema'
import { validateCragForm, type CragActionFailure, type CragActionValues } from '$lib/forms.server'
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
    name: crag.name,
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
    let values: CragActionValues

    try {
      values = await validateCragForm(data)
    } catch (exception) {
      return exception as CragActionFailure
    }

    try {
      await db
        .update(crags)
        .set(values)
        .where(and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)))
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}`)
  },
}
