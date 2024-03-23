import { db } from '$lib/db/db.server.js'
import { boulders, crags } from '$lib/db/schema'
import { validateBoulderForm, type BoulderActionFailure, type BoulderActionValues } from '$lib/forms.server'
import { error, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const bouldersResult = await db
    .select()
    .from(boulders)
    .where(eq(boulders.id, Number(params.boulderId)))

  const cragsResult = await db.select().from(crags)

  if (bouldersResult.length === 0) {
    error(404)
  }

  return {
    boulder: bouldersResult[0],
    crags: cragsResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ params, request }) => {
    const data = await request.formData()
    let values: BoulderActionValues

    try {
      values = await validateBoulderForm(data)
    } catch (error) {
      return error as BoulderActionFailure
    }

    const result = await db
      .update(boulders)
      .set(values)
      .where(eq(boulders.id, Number(params.boulderId)))
      .returning()

    redirect(303, `/boulders/${result[0].id}`)
  },
}
