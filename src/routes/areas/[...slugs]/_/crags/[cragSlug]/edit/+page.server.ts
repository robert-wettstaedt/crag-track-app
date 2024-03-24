import { db } from '$lib/db/db.server.js'
import { crags } from '$lib/db/schema'
import { validateCragForm, type CragActionFailure, type CragActionValues } from '$lib/forms.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const cragsResult = await db.query.crags.findMany({ where: eq(crags.slug, params.cragSlug) })
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} found`)
  }

  return {
    name: crag.name,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ params, request }) => {
    const data = await request.formData()
    let values: CragActionValues

    try {
      values = await validateCragForm(data)
    } catch (error) {
      return error as CragActionFailure
    }

    try {
      await db.update(crags).set(values).where(eq(crags.slug, params.cragSlug))
    } catch (error) {
      if (error instanceof Error) {
        fail(404, { ...values, error: error.message })
      }

      fail(404, { ...values, error: String(error) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}`)
  },
}
