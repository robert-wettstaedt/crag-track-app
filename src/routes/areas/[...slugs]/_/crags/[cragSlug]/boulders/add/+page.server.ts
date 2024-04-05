import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { boulders, crags, generateSlug, users } from '$lib/db/schema'
import { validateBoulderForm, type BoulderActionFailure, type BoulderActionValues } from '$lib/forms.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const parentsResult = await db.query.crags.findMany({ where: eq(crags.slug, params.cragSlug) })
  const parent = parentsResult.at(0)

  if (parent == null) {
    error(404)
  }

  if (parentsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} found`)
  }

  return {
    parent,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user?.email == null) {
      error(401)
    }

    const data = await request.formData()
    let values: BoulderActionValues
    const path = params.slugs.split('/')

    try {
      values = await validateBoulderForm(data)
    } catch (exception) {
      return exception as BoulderActionFailure
    }

    const slug = generateSlug(values.name)

    const parentsResult = await db
      .select({ id: crags.id, name: crags.name })
      .from(crags)
      .where(eq(crags.slug, params.cragSlug))
    const parent = parentsResult.at(0)

    if (parent == null) {
      return fail(400, { ...values, error: `Parent not found ${params.cragSlug}` })
    }

    const existingBouldersResult = await db
      .select()
      .from(boulders)
      .where(and(eq(boulders.slug, slug), eq(boulders.cragFk, parent.id)))

    if (existingBouldersResult.length > 0) {
      return fail(400, {
        ...values,
        error: `Boulder with name "${existingBouldersResult[0].name}" already exists in crag "${parent.name}"`,
      })
    }

    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      await db.insert(boulders).values({ ...values, createdBy: user.id, cragFk: parent.id, slug })
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    const mergedPath = ['areas', ...path, '_', 'crags', params.cragSlug, 'boulders', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
