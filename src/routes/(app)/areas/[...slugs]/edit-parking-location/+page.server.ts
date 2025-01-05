import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { areas, blocks, geolocations } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { convertException } from '$lib/errors'
import { convertAreaSlug } from '$lib/helper.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Query the database to find the area with the given areaId
  const areasResult = await db((tx) =>
    tx.query.areas.findMany({
      where: eq(areas.id, areaId),
    }),
  )
  const area = areasResult.at(0)

  // If the area is not found, throw a 404 error
  if (area == null || area.type === 'area') {
    error(404)
  }

  // Query the database for blocks with geolocation data
  const geolocationBlocksResults = await db((tx) =>
    tx.query.blocks.findMany({
      where: and(isNotNull(blocks.geolocationFk)),
      with: {
        area: buildNestedAreaQuery(), // Include nested area information
        geolocation: true,
      },
    }),
  )

  return {
    ...area,
    blocks: geolocationBlocksResults.map(enrichBlock),
  }
}) satisfies PageServerLoad

export const actions = {
  updateParkingLocation: async ({ locals, params, request }) => {
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

    // Query the database to find the area with the given areaId
    const areasResult = await db((tx) => tx.query.areas.findMany({ where: eq(areas.id, areaId) }))
    const area = areasResult.at(0)

    // If the area is not found, throw a 404 error
    if (area == null || area.type === 'area') {
      error(400, 'Area is not a crag')
    }

    try {
      await db((tx) => tx.insert(geolocations).values({ lat, long, areaFk: area.id }))
    } catch (exception) {
      // Handle any exceptions that occur during the update
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}`)
  },

  removeParkingLocation: async ({ locals, params }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Convert area slug to areaId
    const { areaId } = convertAreaSlug(params)

    // Query the database to find the area with the given areaId
    const areasResult = await db((tx) =>
      tx.query.areas.findMany({
        where: eq(areas.id, areaId),
      }),
    )
    const area = areasResult.at(0)

    // If the area is not found, throw a 404 error
    if (area == null) {
      error(404)
    }

    try {
      await db((tx) => tx.delete(geolocations).where(eq(geolocations.areaFk, area.id)))
    } catch (error) {
      return fail(404, { error: convertException(error) })
    }

    redirect(303, `/areas/${params.slugs}`)
  },
}
