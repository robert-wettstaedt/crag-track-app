import { db } from '$lib/db/db.server.js'
import { boulders, crags, generateSlug } from '$lib/db/schema'
import { validateBoulderForm, type BoulderActionFailure, type BoulderActionValues } from '$lib/forms.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
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
  default: async ({ params, request }) => {
    const data = await request.formData()
    let values: BoulderActionValues
    const path = params.slugs.split('/')

    try {
      values = await validateBoulderForm(data)
    } catch (error) {
      return error as BoulderActionFailure
    }

    const slug = generateSlug(values.name)

    const parentsResult = await db
      .select({ id: crags.id, name: crags.name })
      .from(crags)
      .where(eq(crags.slug, params.cragSlug))
    const parent = parentsResult.at(0)

    if (parent == null) {
      return fail(400, { ...values, error: `Unable to find parent ${params.cragSlug}` })
    }

    const existingBouldersResult = await db
      .select()
      .from(boulders)
      .where(and(eq(boulders.slug, slug), eq(boulders.parent, parent.id)))

    if (existingBouldersResult.length > 0) {
      return fail(400, {
        ...values,
        error: `Boulder with name "${existingBouldersResult[0].name}" already exists in crag "${parent.name}"`,
      })
    }

    try {
      await db.insert(boulders).values({ ...values, createdBy: 1, parent: parent.id, slug })
    } catch (error) {
      if (error instanceof Error) {
        return fail(400, { ...values, error: error.message })
      }

      return fail(400, { ...values, error: JSON.stringify(error) })
    }

    const mergedPath = ['areas', ...path, '_', 'crags', params.cragSlug, 'boulders', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
