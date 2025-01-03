import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { areas, files, generateSlug, geolocations } from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { areaActionSchema, validateFormData, type ActionFailure, type AreaActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/helper.server'
import { getReferences } from '$lib/references.server'
import { renameArea } from '$lib/topo-files.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq, not } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Query the database to find the area with the given areaId
  const area = await db((tx) => tx.query.areas.findFirst({ where: eq(areas.id, areaId) }))

  // If the area is not found, throw a 404 error
  if (area == null) {
    error(404)
  }

  // Return the found area
  return area
}) satisfies PageServerLoad

export const actions = {
  updateArea: async ({ locals, params, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Retrieve form data from the request
    const data = await request.formData()
    let values: AreaActionValues

    try {
      // Validate the form data
      values = await validateFormData(areaActionSchema, data)
    } catch (exception) {
      // If validation fails, return the exception as an AreaActionFailure
      return exception as ActionFailure<AreaActionValues>
    }

    // Convert the area slug to get the areaId
    const { areaId, areaSlug } = convertAreaSlug(params)

    // Generate a slug from the area name
    const slug = generateSlug(values.name)

    // Check if an area with the same slug already exists
    const existingAreasResult = await db((tx) =>
      tx.query.areas.findMany({
        where: and(eq(areas.slug, slug), not(eq(areas.id, areaId))),
      }),
    )

    if (existingAreasResult.length > 0) {
      // If an area with the same name exists, return a 400 error with a message
      return fail(400, { ...values, error: `Area with name "${existingAreasResult[0].name}" already exists` })
    }

    try {
      // Update the area in the database with the validated values
      await db((tx) =>
        tx
          .update(areas)
          .set({ ...values, slug })
          .where(eq(areas.id, areaId)),
      )

      await db((tx) => renameArea(tx, `${areaSlug}-${areaId}`, `${slug}-${areaId}`))
    } catch (exception) {
      // If the update fails, return a 404 error with the exception details
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the updated area page
    redirect(303, `/areas/${params.slugs}`)
  },

  removeArea: async ({ locals, params }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Convert area slug to areaId
    const { areaId } = convertAreaSlug(params)

    // Query the database to find the area with the given areaId
    const area = await db((tx) =>
      tx.query.areas.findFirst({
        where: eq(areas.id, areaId),
        with: {
          areas: true,
          blocks: true,
        },
      }),
    )

    if (area == null) {
      error(404)
    }

    if (area.areas.length > 0) {
      return fail(400, { error: `${area.name} has ${area.areas.length} subareas. Delete subareas first.` })
    }

    if (area.blocks.length > 0) {
      return fail(400, { error: `${area.name} has ${area.blocks.length} blocks. Delete blocks first.` })
    }

    const references = await getReferences(area.id, 'areas')
    if (references.areas.length + references.ascents.length + references.routes.length > 0) {
      return fail(400, { error: 'Area is referenced by other entities. Delete references first.' })
    }

    try {
      await db((tx) => tx.delete(files).where(eq(files.areaFk, areaId)))
      await db((tx) => tx.delete(geolocations).where(eq(geolocations.areaFk, areaId)))
      await db((tx) => tx.update(areas).set({ parentFk: null }).where(eq(areas.parentFk, areaId)))
      await db((tx) => tx.delete(areas).where(eq(areas.id, areaId)))
    } catch (error) {
      return fail(404, { error: convertException(error) })
    }

    const slugs = params.slugs.split('/').slice(0, -1).join('/')
    redirect(303, `/areas/${slugs}`)
  },
}
