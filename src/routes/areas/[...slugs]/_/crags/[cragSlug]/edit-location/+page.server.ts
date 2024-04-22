import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { crags } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichCrag } from '$lib/db/utils'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
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

  const result = await db.query.crags.findMany({
    where: and(isNotNull(crags.lat), isNotNull(crags.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  return {
    crag,
    crags: result.map(enrichCrag),
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
      await db
        .update(crags)
        .set({ lat, long })
        .where(and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)))
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}`)
  },
}
