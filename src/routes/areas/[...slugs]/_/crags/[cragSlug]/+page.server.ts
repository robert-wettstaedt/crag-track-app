import { db } from '$lib/db/db.server'
import { boulders, crags, users } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const cragsResult = await db.select().from(crags).where(eq(crags.slug, params.cragSlug))
  const crag = cragsResult.at(0)

  if (crag == null) {
    error(404)
  }

  if (cragsResult.length > 1) {
    error(400, `Multiple crags with slug ${params.cragSlug} found`)
  }

  const usersResult = await db.select().from(users).where(eq(users.id, crag.createdBy))
  const bouldersResult = await db.select().from(boulders).where(eq(boulders.parent, crag.id))

  return {
    crag: cragsResult[0],
    author: usersResult.at(0),
    boulders: bouldersResult,
  }
}) satisfies PageServerLoad
