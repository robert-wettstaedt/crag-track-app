import { db } from '$lib/db/db.server.js'
import { boulders, crags } from '$lib/db/schema'
import { validateBoulderForm, type BoulderActionFailure, type BoulderActionValues } from '$lib/forms.server'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  const result = await db.select().from(crags)

  return {
    crags: result,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData()
    let values: BoulderActionValues

    try {
      values = await validateBoulderForm(data)
    } catch (error) {
      return error as BoulderActionFailure
    }

    const result = await db
      .insert(boulders)
      .values({ ...values, createdBy: 1 })
      .returning()

    redirect(303, `/boulders/${result[0].id}`)
  },
}
