import { db } from '$lib/db/db.server'
import { ascents, boulders, users } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const ascentsResult = await db
    .select()
    .from(ascents)
    .where(eq(ascents.id, Number(params.ascentId)))
    .innerJoin(users, eq(ascents.createdBy, users.id))
    .innerJoin(boulders, eq(ascents.boulderFk, boulders.id))

  if (ascentsResult.length === 0) {
    error(404)
  }

  return {
    ascent: ascentsResult[0].ascents,
    author: ascentsResult[0].users,
    boulder: ascentsResult[0].boulders,
  }
}) satisfies PageServerLoad
