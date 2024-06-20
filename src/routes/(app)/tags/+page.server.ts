import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { routesToTags, tags } from '$lib/db/schema'
import { validateTagForm, type TagActionFailure, type TagActionValues } from '$lib/forms.server'
import { fail } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.query.tags.findMany()

  return {
    tags: result,
  }
}) satisfies PageServerLoad

export const actions = {
  delete: async ({ request }) => {
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
      await db.delete(tags).where(eq(tags.id, values.id))
      await db.delete(routesToTags).where(eq(routesToTags.tagFk, values.id))
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }
  },
}
