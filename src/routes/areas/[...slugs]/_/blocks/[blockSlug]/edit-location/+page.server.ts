import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug } = await parent()

  // Get the current session from locals
  const session = await locals.auth()
  if (session?.user == null) {
    // If the user is not authenticated, throw a 401 error
    error(401)
  }

  // Query the database for blocks matching the given slug and areaId
  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
  })
  // Get the first block from the result
  const block = blocksResult.at(0)

  // If no block is found, throw a 404 error
  if (block == null) {
    error(404)
  }

  // If more than one block is found, throw a 400 error
  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  // Query the database for blocks with geolocation data
  const result = await db.query.blocks.findMany({
    where: and(isNotNull(blocks.lat), isNotNull(blocks.long)),
    with: {
      area: buildNestedAreaQuery(),
    },
  })

  // Return the block and the enriched geolocation blocks
  return {
    block,
    blocks: result.map(enrichBlock),
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    // Convert area slug to areaId
    const { areaId } = convertAreaSlug(params)

    // Get the current session from locals
    const session = await locals.auth()
    if (session?.user == null) {
      // If the user is not authenticated, throw a 401 error
      error(401)
    }

    // Retrieve form data from the request
    const data = await request.formData()

    // Extract latitude and longitude from the form data
    const rawLat = data.get('lat')
    const rawLong = data.get('long')

    // Store the raw latitude and longitude values
    const values = { lat: rawLat, long: rawLong }

    // Validate the latitude value
    if (typeof rawLat !== 'string' || rawLat.length === 0) {
      return fail(400, { ...values, error: 'lat is required' })
    }

    // Validate the longitude value
    if (typeof rawLong !== 'string' || rawLong.length === 0) {
      return fail(400, { ...values, error: 'long is required' })
    }

    // Convert latitude and longitude to numbers
    const lat = Number(rawLat)
    const long = Number(rawLong)

    // Check if the latitude is a valid number
    if (Number.isNaN(lat)) {
      return fail(400, { ...values, error: 'lat is not a valid Latitude' })
    }

    // Check if the longitude is a valid number
    if (Number.isNaN(long)) {
      return fail(400, { ...values, error: 'long is not a valid Longitude' })
    }

    try {
      // Update the block with the new latitude and longitude
      await db
        .update(blocks)
        .set({ lat, long })
        .where(and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)))
    } catch (exception) {
      // Handle any exceptions that occur during the update
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the block's page after a successful update
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
  },
}
