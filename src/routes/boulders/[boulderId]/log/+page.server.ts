import { db } from '$lib/db/db.server.js'
import { ascents, boulders } from '$lib/db/schema'
import { validateAscentForm, type AscentActionFailure, type AscentActionValues } from '$lib/forms.server'
import { error, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const bouldersResult = await db
    .select()
    .from(boulders)
    .where(eq(boulders.id, Number(params.boulderId)))

  if (bouldersResult.length === 0) {
    error(404)
  }

  return {
    boulder: bouldersResult[0],
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ params, request }) => {
    const data = await request.formData()
    let values: AscentActionValues

    try {
      values = await validateAscentForm(data)
    } catch (error) {
      return error as AscentActionFailure
    }

    const result = await db
      .insert(ascents)
      .values({ ...values, boulder: Number(params.boulderId), createdBy: 1 })
      .returning()

    redirect(303, `/ascents/${result[0].id}`)
  },
}
