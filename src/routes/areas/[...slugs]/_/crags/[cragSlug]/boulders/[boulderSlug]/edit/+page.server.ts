import { db } from '$lib/db/db.server.js'
import { boulders, crags } from '$lib/db/schema'
import { validateBoulderForm, type BoulderActionFailure, type BoulderActionValues } from '$lib/forms.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const crag = await db.query.crags.findFirst({
    where: eq(crags.slug, params.cragSlug),
    with: {
      boulders: {
        where: eq(boulders.slug, params.boulderSlug),
      },
    },
  })

  const boulder = crag?.boulders?.at(0)

  if (boulder == null) {
    error(404)
  }

  if (crag != null && crag.boulders.length > 1) {
    error(400, `Multiple boulders with slug ${params.boulderSlug} found`)
  }

  return {
    boulder,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const data = await request.formData()
    let values: BoulderActionValues

    try {
      values = await validateBoulderForm(data)
    } catch (error) {
      return error as BoulderActionFailure
    }

    const crag = await db.query.crags.findFirst({
      where: eq(crags.slug, params.cragSlug),
      with: {
        boulders: {
          where: eq(boulders.slug, params.boulderSlug),
        },
      },
    })

    const boulder = crag?.boulders?.at(0)

    if (boulder == null) {
      return fail(404, values)
    }

    if (crag != null && crag.boulders.length > 1) {
      return fail(400, { ...values, error: `Multiple boulders with slug ${params.boulderSlug} found` })
    }

    try {
      await db.update(boulders).set(values).where(eq(boulders.id, boulder.id))
    } catch (error) {
      if (error instanceof Error) {
        return fail(404, { ...values, error: error.message })
      }

      return fail(404, { ...values, error: String(error) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}/boulders/${params.boulderSlug}`)
  },
}
