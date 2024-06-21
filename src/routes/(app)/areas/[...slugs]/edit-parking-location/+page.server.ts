import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { areas, geolocations } from '$lib/db/schema'
import { enrichBlock } from '$lib/db/utils'
import { convertAreaSlug } from '$lib/helper.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Authenticate the user session
  const session = await locals.auth()
  if (session?.user == null) {
    // If the user is not authenticated, throw a 401 error
    error(401)
  }

  // Query the database to find the area with the given areaId
  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      blocks: {
        with: {
          area: true,
          geolocation: true,
        },
      },
    },
  })
  const area = areasResult.at(0)

  // If the area is not found, throw a 404 error
  if (area == null) {
    error(404)
  }

  const blocks = area.blocks.map((block) => enrichBlock(block))

  return {
    ...area,
    blocks,
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

    // Query the database to find the area with the given areaId
    const areasResult = await db.query.areas.findMany({ where: eq(areas.id, areaId) })
    const area = areasResult.at(0)

    // If the area is not found, throw a 404 error
    if (area == null) {
      error(404)
    }

    if (area.type !== 'crag') {
      error(400, 'Area is not a crag')
    }

    try {
      await db.insert(geolocations).values({ lat, long, areaFk: area.id })
    } catch (exception) {
      // Handle any exceptions that occur during the update
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}`)
  },
}
