import { db } from '$lib/db/db.server'
import { crags } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { buildNestedAreaQuery, enrichCrag } from '$lib/db/utils'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const cragsResult = await db.query.crags.findMany({
    where: eq(crags.slug, params.cragSlug),
  })
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} found`)
  }

  const result = await db.query.crags.findMany({
    where: and(isNotNull(crags.lat), isNotNull(crags.long)),
    with: {
      parentArea: buildNestedAreaQuery(),
    },
  })

  return {
    crag: crag as InferResultType<'crags', { author: true; boulders: true }>,
    crags: result.map(enrichCrag),
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ params, request }) => {
    const data = await request.formData()

    const rawLat = data.get('lat')
    const rawLong = data.get('long')

    const values = { lat: rawLat, long: rawLong }

    if (typeof rawLat !== 'string' || rawLat.length === 0) {
      return fail(400, { ...values, error: 'lat is required' })
    }

    if (typeof rawLong !== 'string' || rawLong.length === 0) {
      return fail(400, { ...values, error: 'long is required' })
    }

    const lat = Number(rawLat)
    const long = Number(rawLong)

    if (Number.isNaN(lat)) {
      return fail(400, { ...values, error: 'lat is not a valid Latitude' })
    }

    if (Number.isNaN(lat)) {
      return fail(400, { ...values, error: 'long is not a valid Longitude' })
    }

    try {
      await db.update(crags).set({ lat, long }).where(eq(crags.slug, params.cragSlug))
    } catch (error) {
      if (error instanceof Error) {
        return fail(404, { ...values, error: error.message })
      }

      return fail(404, { ...values, error: String(error) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}`)
  },
}
