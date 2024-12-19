import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { routesToTags, tags } from '$lib/db/schema'
import { validateTagForm, type TagActionFailure, type TagActionValues } from '$lib/forms.server'
import { convertException } from '$lib/errors'
import { error, fail } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  const result = await db((tx) => tx.query.tags.findMany())

  return {
    tags: result,
  }
}) satisfies PageServerLoad

export const actions = {
  delete: async ({ locals, request }) => {
    if (!locals.userPermissions?.includes('data.edit')) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    const data = await request.formData()

    let values: TagActionValues

    try {
      // Validate the form data
      values = await validateTagForm(data)
    } catch (exception) {
      // If validation fails, return the exception as TagActionFailure
      return exception as TagActionFailure
    }

    try {
      await db((tx) => tx.delete(tags).where(eq(tags.id, values.id)))
      await db((tx) => tx.delete(routesToTags).where(eq(routesToTags.tagFk, values.id)))
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }
  },
}
