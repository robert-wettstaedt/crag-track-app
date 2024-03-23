import { db } from '$lib/db/db.server'
import { ascents, boulders, crags, users } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const bouldersResult = await db
    .select()
    .from(boulders)
    .where(eq(boulders.id, Number(params.boulderId)))
    .innerJoin(users, eq(boulders.createdBy, users.id))
    .innerJoin(crags, eq(boulders.parent, crags.id))

  if (bouldersResult.length === 0) {
    error(404)
  }

  const ascentsResult = await db
    .select()
    .from(ascents)
    .where(eq(ascents.boulder, Number(params.boulderId)))

  return {
    boulder: bouldersResult[0].boulders,
    author: bouldersResult[0].users,
    crag: bouldersResult[0].crags,
    ascents: ascentsResult,
  }
}) satisfies PageServerLoad
