import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { blocks } from '$lib/db/schema'
import { validateBlockForm, type BlockActionFailure, type BlockActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug } = await parent()

  // Authenticate the user session
  const session = await locals.auth()
  if (session?.user == null) {
    error(401) // Unauthorized error if user is not authenticated
  }

  // Query the database to find blocks matching the provided slug and areaId
  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
  })
  const block = blocksResult.at(0) // Get the first block from the result

  // If no block is found, return a 404 error
  if (block == null) {
    error(404) // Not Found error
  }

  // If multiple blocks are found, return a 400 error with a message
  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`) // Bad Request error
  }

  // Return the block name to be used in the page
  return {
    name: block.name,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      // If no user is found in the session, throw a 401 error
      error(401)
    }

    // Retrieve form data from the request
    const data = await request.formData()
    let values: BlockActionValues

    try {
      // Validate the form data
      values = await validateBlockForm(data)
    } catch (exception) {
      // If validation fails, return the exception as BlockActionFailure
      return exception as BlockActionFailure
    }

    try {
      // Update the block in the database with the validated values
      await db
        .update(blocks)
        .set(values)
        .where(and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)))
    } catch (exception) {
      // If the update fails, return a 404 error with the exception details
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the block's page after successful update
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
  },
}
