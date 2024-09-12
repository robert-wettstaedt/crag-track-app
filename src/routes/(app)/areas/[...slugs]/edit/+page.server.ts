import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { areas, files, generateSlug, geolocations } from '$lib/db/schema'
import { validateAreaForm, type AreaActionFailure, type AreaActionValues } from '$lib/forms.server'
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
  const area = await db.query.areas.findFirst({ where: eq(areas.id, areaId) })

  // If the area is not found, throw a 404 error
  if (area == null) {
    error(404)
  }

  // Return the found area
  return area
}) satisfies PageServerLoad

export const actions = {
  updateArea: async ({ locals, params, request }) => {
    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      // If the user is not authenticated, throw a 401 error
      error(401)
    }

    // Retrieve form data from the request
    const data = await request.formData()
    let values: AreaActionValues

    try {
      // Validate the form data
      values = await validateAreaForm(data)
    } catch (exception) {
      // If validation fails, return the exception as an AreaActionFailure
      return exception as AreaActionFailure
    }

    // Generate a slug from the area name
    const slug = generateSlug(values.name)

    // Check if an area with the same slug already exists
    const existingAreasResult = await db.query.areas.findMany({ where: eq(areas.slug, slug) })

    if (existingAreasResult.length > 0) {
      // If an area with the same name exists, return a 400 error with a message
      return fail(400, { ...values, error: `Area with name "${existingAreasResult[0].name}" already exists` })
    }

    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    try {
      // Update the area in the database with the validated values
      await db
        .update(areas)
        .set({ ...values, slug })
        .where(eq(areas.id, areaId))
    } catch (exception) {
      // If the update fails, return a 404 error with the exception details
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the updated area page
    redirect(303, `/areas/${params.slugs}`)
  },

  removeArea: async ({ locals, params }) => {
    // Convert area slug to areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      // If the user is not authenticated, throw a 401 error
      error(401)
    }

    // Query the database to find the area with the given areaId
    const area = await db.query.areas.findFirst({
      where: eq(areas.id, areaId),
      with: {
        areas: true,
        blocks: true,
      },
    })

    if (area == null) {
      error(404)
    }

    if (area.areas.length > 0) {
      return fail(400, { error: `${area.name} has ${area.areas.length} subareas. Delete subareas first.` })
    }

    if (area.blocks.length > 0) {
      return fail(400, { error: `${area.name} has ${area.blocks.length} blocks. Delete blocks first.` })
    }

    try {
      await db.delete(files).where(eq(files.areaFk, areaId))
      await db.delete(geolocations).where(eq(geolocations.areaFk, areaId))
      await db.update(areas).set({ parentFk: null }).where(eq(areas.parentFk, areaId))
      await db.delete(areas).where(eq(areas.id, areaId))
    } catch (error) {
      return fail(404, { error: convertException(error) })
    }

    const slugs = params.slugs.split('/').slice(0, -1).join('/')
    redirect(303, `/areas/${slugs}`)
  },
}
