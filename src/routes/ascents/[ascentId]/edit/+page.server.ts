import { db } from '$lib/db/db.server.js'
import { ascents, boulders } from '$lib/db/schema'
import { validateAscentForm, type AscentActionFailure, type AscentActionValues } from '$lib/forms.server'
import { error, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const ascentsResult = await db
    .select()
    .from(ascents)
    .where(eq(ascents.id, Number(params.ascentId)))
    .innerJoin(boulders, eq(ascents.boulderFk, boulders.id))

  if (ascentsResult.length === 0) {
    error(404)
  }

  return {
    ascent: ascentsResult[0].ascents,
    boulder: ascentsResult[0].boulders,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const data = await request.formData()
    let values: AscentActionValues

    try {
      values = await validateAscentForm(data)
    } catch (error) {
      return error as AscentActionFailure
    }

    const result = await db
      .update(ascents)
      .set(values)
      .where(eq(ascents.id, Number(params.ascentId)))
      .returning()

    redirect(303, `/ascents/${result[0].id}`)
  },
}
