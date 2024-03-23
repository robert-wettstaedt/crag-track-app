import { db } from '$lib/db/db.server'
import { boulders, crags, users } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const cragsResult = await db
    .select()
    .from(crags)
    .where(eq(crags.id, Number(params.cragId)))
    .innerJoin(users, eq(crags.createdBy, users.id))

  const bouldersResult = await db
    .select()
    .from(boulders)
    .where(eq(boulders.parent, Number(params.cragId)))

  if (cragsResult.length === 0) {
    error(404)
  }

  return {
    crag: cragsResult[0].crags,
    author: cragsResult[0].users,
    boulders: bouldersResult,
  }
}) satisfies PageServerLoad
