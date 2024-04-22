import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { boulders, crags, generateSlug, users } from '$lib/db/schema'
import { validateBoulderForm, type BoulderActionFailure, type BoulderActionValues } from '$lib/forms.server'
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
    let values: BoulderActionValues
    const { path } = convertAreaSlug(params)

    try {
      values = await validateBoulderForm(data)
    } catch (exception) {
      return exception as BoulderActionFailure
    }

    const slug = generateSlug(values.name)

    const crag = await db.query.crags.findFirst({
      where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
    })

    if (crag == null) {
      return fail(400, { ...values, error: `Parent not found ${params.cragSlug}` })
    }

    const existingBouldersResult = await db
      .select()
      .from(boulders)
      .where(and(eq(boulders.slug, slug), eq(boulders.cragFk, crag.id)))

    if (existingBouldersResult.length > 0) {
      return fail(400, {
        ...values,
        error: `Boulder with name "${existingBouldersResult[0].name}" already exists in crag "${crag.name}"`,
      })
    }

    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      await db.insert(boulders).values({ ...values, createdBy: user.id, cragFk: crag.id, slug })
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    const mergedPath = ['areas', ...path, '_', 'crags', params.cragSlug, 'boulders', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
