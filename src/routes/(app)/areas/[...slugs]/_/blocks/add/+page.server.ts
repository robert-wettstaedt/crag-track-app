import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { areas, blocks, generateSlug, users } from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { blockActionSchema, validateFormData, type ActionFailure, type BlockActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/helper.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Query the database to find the area with the given areaId
  const areaResult = await db((tx) => tx.query.areas.findFirst({ where: eq(areas.id, areaId) }))

  // If the area is not found, throw a 404 error
  if (areaResult == null) {
    error(404)
  }

  // Return the area result
  return {
    area: areaResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Retrieve form data from the request
    const data = await request.formData()
    let values: BlockActionValues

    try {
      // Validate the form data
      values = await validateFormData(blockActionSchema, data)
    } catch (exception) {
      // If validation fails, return the exception as a BlockActionFailure
      return exception as ActionFailure<BlockActionValues>
    }

    // Generate a slug from the block name
    const slug = generateSlug(values.name)

    // Convert the area slug from the parameters
    const { areaId, path } = convertAreaSlug(params)

    // Check if a block with the same slug already exists in the area
    const existingBlocksResult = await db((tx) =>
      tx.query.blocks.findFirst({
        where: and(eq(blocks.slug, slug), eq(blocks.areaFk, areaId)),
      }),
    )

    if (existingBlocksResult != null) {
      // If a block with the same slug exists, return a 400 error with a message
      return fail(400, {
        ...values,
        error: `Block with name "${existingBlocksResult.name}" already exists in area "${parent.name}"`,
      })
    }

    try {
      // Find the user in the database using their email
      const user = await db((tx) => tx.query.users.findFirst({ where: eq(users.authUserFk, locals.user!.id) }))
      if (user == null) {
        // If the user is not found, throw an error
        throw new Error('User not found')
      }

      // Insert the new block into the database
      await db((tx) => tx.insert(blocks).values({ ...values, createdBy: user.id, areaFk: areaId, slug }))
    } catch (exception) {
      // If insertion fails, return a 400 error with the exception message
      return fail(400, { ...values, error: convertException(exception) })
    }

    // Redirect to the newly created block's page
    const mergedPath = ['areas', ...path, '_', 'blocks', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
