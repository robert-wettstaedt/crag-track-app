import { db } from '$lib/db/db.server'
import { users, type User } from '$lib/db/schema'
import { eq } from 'drizzle-orm'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  // Authenticate the user and get the session object
  const session = await event.locals.auth()

  // Initialize a variable to store the user information
  let user: User | undefined

  // Check if the session contains a user with a valid email and name
  if (session?.user?.email != null && session.user.name != null) {
    // Try to find the user in the database by their email
    user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    // If the user is not found in the database, insert a new user record
    if (user == null) {
      const result = await db
        .insert(users)
        .values({ email: session.user.email, userName: session.user.name })
        .returning()
      // Get the newly inserted user from the result
      user = result.at(0)
    }
  }

  // Return the session and user information
  return {
    session,
    user,
  }
}
