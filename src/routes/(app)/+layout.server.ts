import { db } from '$lib/db/db.server'
import { users, userSettings } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { eq } from 'drizzle-orm'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  // Authenticate the user and get the session object
  const session = await event.locals.auth()

  // Initialize a variable to store the user information
  let user: InferResultType<'users', { userSettings: { columns: { gradingScale: true } } }> | undefined

  // Check if the session contains a user with a valid email and name
  if (session?.user?.email != null && session.user.name != null) {
    // Try to find the user in the database by their email
    user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      with: {
        userSettings: {
          columns: {
            gradingScale: true,
          },
        },
      },
    })

    // If the user is not found in the database, insert a new user record
    if (user == null) {
      const [createdUser] = await db
        .insert(users)
        .values({ email: session.user.email, userName: session.user.name })
        .returning()

      const [createdUserSettings] = await db.insert(userSettings).values({ userFk: createdUser.id }).returning()
      await db.update(users).set({ userSettingsFk: createdUserSettings.id }).where(eq(users.id, createdUser.id))

      user = { ...createdUser, userSettings: { gradingScale: createdUserSettings.gradingScale } }
    }
  }

  const grades = await db.query.grades.findMany()

  // Return the session and user information
  return {
    grades,
    session,
    user,
  }
}
