import { db } from '$lib/db/db.server'
import { eq, not } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { ascents, users } from '$lib/db/schema'
import { error } from '@sveltejs/kit'

export const load = (async ({ params }) => {
  const usersResult = await db.query.users.findMany({
    where: eq(users.userName, params.name),
    with: {
      ascents: {
        where: not(eq(ascents.type, 'attempt')),
        with: {
          parentBoulder: true,
        },
      },
    },
  })

  const user = usersResult.at(0)

  if (user == null) {
    error(404)
  }

  if (usersResult.length > 1) {
    error(400, `Multiple users with name ${params.name} found`)
  }

  return {
    user,
  }
}) satisfies PageServerLoad
