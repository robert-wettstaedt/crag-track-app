import { db } from '$lib/db/db.server.js'
import { ascents, boulders } from '$lib/db/schema'
import { validateAscentForm, type AscentActionFailure, type AscentActionValues } from '$lib/forms.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const bouldersResult = await db.query.boulders.findMany({ where: eq(boulders.slug, params.boulderSlug) })
  const boulder = bouldersResult.at(0)

  if (boulder == null) {
    error(404)
  }

  if (bouldersResult.length > 1) {
    error(400, `Multiple boulders with slug ${params.boulderSlug} found`)
  }

  return {
    boulder,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ params, request }) => {
    const data = await request.formData()
    let values: AscentActionValues

    try {
      values = await validateAscentForm(data)
    } catch (error) {
      return error as AscentActionFailure
    }

    const parentsResult = await db.select().from(boulders).where(eq(boulders.slug, params.boulderSlug))
    const parent = parentsResult.at(0)

    if (parent == null) {
      return fail(400, { ...values, error: `Unable to find boulder ${params.boulderSlug}` })
    }

    try {
      await db.insert(ascents).values({ ...values, boulder: parent.id, createdBy: 1 })
    } catch (error) {
      if (error instanceof Error) {
        return fail(400, { ...values, error: error.message })
      }

      return fail(400, { ...values, error: JSON.stringify(error) })
    }

    const mergedPath = ['areas', params.slugs, '_', 'crags', params.cragSlug, 'boulders', params.boulderSlug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
