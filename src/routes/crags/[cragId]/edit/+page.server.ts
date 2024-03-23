import { db } from '$lib/db/db.server.js'
import { crags } from '$lib/db/schema'
import { validateCragForm, type CragActionFailure, type CragActionValues } from '$lib/forms.server'
import { error, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const result = await db
    .select({ name: crags.name })
    .from(crags)
    .where(eq(crags.id, Number(params.cragId)))

  if (result.length === 0) {
    error(404)
  }

  return {
    name: result[0].name,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ params, request }) => {
    const data = await request.formData()
    let values: CragActionValues

    try {
      values = await validateCragForm(data)
    } catch (error) {
      return error as CragActionFailure
    }

    const result = await db
      .update(crags)
      .set(values)
      .where(eq(crags.id, Number(params.cragId)))
      .returning()

    redirect(303, `/crags/${result[0].id}`)
  },
}
