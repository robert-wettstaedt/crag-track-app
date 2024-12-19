import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { blocks, geolocations } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { convertException } from '$lib/errors'
import { convertAreaSlug } from '$lib/helper.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug } = await parent()

  // Query the database for blocks matching the given slug and areaId
  const blocksResult = await db((tx) =>
    tx.query.blocks.findMany({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        area: buildNestedAreaQuery(),
        geolocation: true,
      },
    }),
  )
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
  const result = await db((tx) =>
    tx.query.blocks.findMany({
      where: and(isNotNull(blocks.geolocationFk)),
      with: {
        area: buildNestedAreaQuery(),
        geolocation: true,
      },
    }),
  )

  // Return the block and the enriched geolocation blocks
  return {
    block: enrichBlock(block),
    blocks: result.map(enrichBlock),
  }
}) satisfies PageServerLoad

export const actions = {
  updateLocation: async ({ locals, params, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Convert area slug to areaId
    const { areaId } = convertAreaSlug(params)

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

    // Query the database for blocks matching the given slug and areaId
    const blocksResult = await db((tx) =>
      tx.query.blocks.findMany({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      }),
    )
    // Get the first block from the result
    const block = blocksResult.at(0)

    // If no block is found, throw a 404 error
    if (block == null) {
      return fail(404, { ...values, error: 'Block not found' })
    }

    try {
      // If the block does not have a geolocation, insert a new geolocation record
      if (block.geolocationFk == null) {
        const [geolocation] = await db((tx) =>
          tx.insert(geolocations).values({ lat, long, blockFk: block.id }).returning(),
        )
        // Update the block with the new geolocation foreign key
        await db((tx) => tx.update(blocks).set({ geolocationFk: geolocation.id }).where(eq(blocks.id, block.id)))
      } else {
        // If the block already has a geolocation, update the existing geolocation record
        await db((tx) => tx.update(geolocations).set({ lat, long }).where(eq(geolocations.id, block.geolocationFk!)))
      }
    } catch (exception) {
      // Handle any exceptions that occur during the update
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the block's page after a successful update
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
  },

  removeGeolocation: async ({ locals, params }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Convert area slug to areaId
    const { areaId } = convertAreaSlug(params)

    // Query the database for blocks matching the given slug and areaId
    const blocksResult = await db((tx) =>
      tx.query.blocks.findMany({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      }),
    )
    // Get the first block from the result
    const block = blocksResult.at(0)

    // If no block is found, throw a 404 error
    if (block == null) {
      return fail(404, { error: 'Block not found' })
    }

    try {
      // If the block has a geolocation, delete the geolocation record
      if (block.geolocationFk != null) {
        await db((tx) => tx.delete(geolocations).where(eq(geolocations.id, block.geolocationFk!)))
      }

      // Update the block to remove the geolocation foreign key
      await db((tx) => tx.update(blocks).set({ geolocationFk: null }).where(eq(blocks.id, block.id)))
    } catch (error) {
      return fail(400, { error: convertException(error) })
    }

    // Redirect to the block's page after a successful update
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
  },
}
