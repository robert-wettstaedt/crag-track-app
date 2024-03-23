import { db } from '$lib/db/db.server.js'
import { crags } from '$lib/db/schema'
import { validateCragForm, type CragActionFailure, type CragActionValues } from '$lib/forms.server.js'
import { redirect } from '@sveltejs/kit'

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData()
    let values: CragActionValues

    try {
      values = await validateCragForm(data)
    } catch (error) {
      return error as CragActionFailure
    }

    const result = await db
      .insert(crags)
      .values({ ...values, createdBy: 1 })
      .returning()

    redirect(303, `/crags/${result[0].id}`)
  },
}
