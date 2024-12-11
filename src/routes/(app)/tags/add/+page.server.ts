import { convertException } from '$lib'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { tags } from '$lib/db/schema'
import { validateTagForm, type TagActionFailure, type TagActionValues } from '$lib/forms.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types.js'

export const load = (({ locals }) => {
  if (!locals.user?.appPermissions?.includes('data.edit')) {
    error(404)
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, request }) => {
    if (!locals.user?.appPermissions?.includes('data.edit')) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Get the form data from the request
    const data = await request.formData()
    let values: TagActionValues

    try {
      // Validate the form data
      values = await validateTagForm(data)
    } catch (exception) {
      // If validation fails, return the exception as TagActionFailure
      return exception as TagActionFailure
    }

    // Check if an area with the same slug already exists
    const existingTagsResult = await db((tx) => tx.query.tags.findMany({ where: eq(tags.id, values.id) }))

    if (existingTagsResult.length > 0) {
      // If an area with the same name exists, return a 400 error with a message
      return fail(400, { ...values, error: `Tag with ID "${existingTagsResult[0].id}" already exists` })
    }

    try {
      // Insert the new tag into the database
      await db((tx) => tx.insert(tags).values(values).returning())
    } catch (exception) {
      // If an error occurs during insertion, return a 400 error with the exception message
      return fail(400, { ...values, error: convertException(exception) })
    }

    // Redirect to the new area path
    redirect(303, '/tags')
  },
}
