import { db } from '$lib/db/db.server'
import { crags, areas, users } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { eq, or } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const path = params.slugs.split('/')

  const areasResult = await db
    .select()
    .from(areas)
    .where(or(...path.map((slug) => eq(areas.slug, slug))))

  const slug = path.at(-1)
  const area = areasResult.at(-1)

  if (slug == null || area == null || area.slug !== slug) {
    error(404)
  }

  const usersResult = await db.select().from(users).where(eq(users.id, areasResult[0].createdBy))
  const cragsResult = await db.select().from(crags).where(eq(crags.parent, area.id))
  const childrenResult = await db.select().from(areas).where(eq(areas.parent, area.id))

  return {
    area,
    author: usersResult.at(0),
    crags: cragsResult,
    children: childrenResult,
  }
}) satisfies PageServerLoad
