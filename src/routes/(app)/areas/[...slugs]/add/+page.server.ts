import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { areas, generateSlug, users, type Area } from '$lib/db/schema'
import { validateAreaForm, type AreaActionFailure, type AreaActionValues } from '$lib/forms.server.js'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  // Retrieve areaId and canAddArea from the parent function
  const { areaId, canAddArea } = await parent()

  // Get the current session from locals
  const session = await locals.auth()
  // If the user is not authenticated, throw a 401 error
  if (session?.user == null) {
    error(401)
  }

  // Query the database to find the parent area by areaId
  const parentAreaResult = await db.query.areas.findFirst({ where: eq(areas.id, areaId) })

  // If the maximum depth for adding areas is reached, throw a 400 error
  if (!canAddArea) {
    error(400, 'Max depth reached')
  }

  // Return the parent area result
  return {
    parent: parentAreaResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    // Retrieve the current session from locals
    const session = await locals.auth()
    // If the user is not authenticated, throw a 401 error
    if (session?.user?.email == null) {
      error(401)
    }

    // Get the form data from the request
    const data = await request.formData()
    let values: AreaActionValues

    try {
      // Validate the form data
      values = await validateAreaForm(data)
    } catch (exception) {
      // If validation fails, return the exception as AreaActionFailure
      return exception as AreaActionFailure
    }

    // Generate a slug from the area name
    const slug = generateSlug(values.name)

    let parentArea: Area | undefined
    let path: string[]
    try {
      // Convert the area slug from the parameters
      const { areaId, path: areaPath } = convertAreaSlug(params)
      // Find the parent area in the database
      parentArea = await db.query.areas.findFirst({ where: eq(areas.id, areaId) })
      path = areaPath
    } catch (error) {
      // If an error occurs, set parentArea to undefined and path to an empty array
      parentArea = undefined
      path = []
    }

    // Check if an area with the same slug already exists
    const existingAreasResult = await db.query.areas.findMany({ where: eq(areas.slug, slug) })
    if (existingAreasResult.length > 0) {
      // If an area with the same name exists, return a 400 error with a message
      return fail(400, { ...values, error: `Area with name "${existingAreasResult[0].name}" already exists` })
    }

    let createdArea: Area
    try {
      // Find the user in the database by email
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      // Insert the new area into the database
      createdArea = (
        await db
          .insert(areas)
          .values({ ...values, createdBy: user.id, parentFk: parentArea?.id, slug })
          .returning()
      )[0]
    } catch (exception) {
      // If an error occurs during insertion, return a 400 error with the exception message
      return fail(400, { ...values, error: convertException(exception) })
    }

    // Construct the merged path for the new area
    const mergedPath = ['areas', ...path, `${slug}-${createdArea?.id}`].join('/')
    // Redirect to the new area path
    redirect(303, '/' + mergedPath)
  },
}
