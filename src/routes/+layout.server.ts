import { db } from '$lib/db/db.server'
import { users, type User, files } from '$lib/db/schema'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.auth()

  let user: User | undefined

  if (session?.user?.email != null && session.user.name != null) {
    user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (user == null) {
      const result = await db
        .insert(users)
        .values({ email: session.user.email, userName: session.user.name })
        .returning()
      user = result.at(0)
    }
  }

  return {
    session,
    user,
  }
}
