import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { areas, generateSlug, users, type Area } from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { areaActionSchema, validate, type ActionFailure, type AreaActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/helper.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve areaId and canAddArea from the parent function
  const { areaId, canAddArea } = await parent()

  // Query the database to find the parent area by areaId
  const parentAreaResult = await db((tx) => tx.query.areas.findFirst({ where: eq(areas.id, areaId) }))

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
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Get the form data from the request
    const data = await request.formData()
    let values: AreaActionValues

    try {
      values = await validate(areaActionSchema, data)
    } catch (exception) {
      return exception as ActionFailure<AreaActionValues>
    }

    let parentArea: Area | undefined
    let path: string[]
    try {
      // Convert the area slug from the parameters
      const { areaId, path: areaPath } = convertAreaSlug(params)
      // Find the parent area in the database
      parentArea = await db((tx) => tx.query.areas.findFirst({ where: eq(areas.id, areaId) }))
      path = areaPath
    } catch (error) {
      // If an error occurs, set parentArea to undefined and path to an empty array
      parentArea = undefined
      path = []
    }

    // Generate a slug from the area name
    const slug = generateSlug(values.name)

    // Check if an area with the same slug already exists
    const existingAreasResult = await db((tx) => tx.query.areas.findMany({ where: eq(areas.slug, slug) }))

    if (existingAreasResult.length > 0) {
      // If an area with the same name exists, return a 400 error with a message
      return fail(400, { ...values, error: `Area with name "${existingAreasResult[0].name}" already exists` })
    }

    let createdArea: Area
    try {
      // Find the user in the database by email
      const user = await db((tx) => tx.query.users.findFirst({ where: eq(users.authUserFk, locals.user!.id) }))
      if (user == null) {
        throw new Error('User not found')
      }

      // Insert the new area into the database
      createdArea = (
        await db((tx) =>
          tx
            .insert(areas)
            .values({ ...values, createdBy: user.id, parentFk: parentArea?.id, slug })
            .returning(),
        )
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
