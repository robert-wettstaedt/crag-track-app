import { db } from '$lib/db/db.server'
import { ascents, boulders, users } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { desc, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const bouldersResult = await db.select().from(boulders).where(eq(boulders.slug, params.boulderSlug))
  const boulder = bouldersResult.at(0)

  if (boulder == null) {
    error(404)
  }

  if (bouldersResult.length > 1) {
    error(400, `Multiple boulders with slug ${params.boulderSlug} found`)
  }

  const usersResult = await db.select().from(users).where(eq(users.id, boulder.createdBy))
  const ascentsResult = await db
    .select()
    .from(ascents)
    .where(eq(ascents.boulder, boulder.id))
    .orderBy(desc(ascents.dateTime))

  return {
    boulder,
    author: usersResult.at(0),
    ascents: ascentsResult.map((ascent) => ({ ascent, boulder })),
  }
}) satisfies PageServerLoad
