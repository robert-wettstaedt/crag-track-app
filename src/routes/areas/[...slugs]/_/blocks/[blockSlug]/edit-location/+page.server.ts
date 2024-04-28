import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
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

  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
  })
  const block = blocksResult.at(0)

  if (block == null) {
    error(404)
  }

  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  const result = await db.query.blocks.findMany({
    where: and(isNotNull(blocks.lat), isNotNull(blocks.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  return {
    block,
    blocks: result.map(enrichBlock),
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
        .update(blocks)
        .set({ lat, long })
        .where(and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)))
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
  },
}
