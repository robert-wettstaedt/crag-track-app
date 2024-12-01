import { db } from '$lib/db/db.server'
import { routes, users, userSettings, type User } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { MAX_AREA_NESTING_DEPTH } from '$lib/db/utils'
import type { User as AuthUser } from '@supabase/supabase-js'
import { error } from '@sveltejs/kit'
import { eq, SQL } from 'drizzle-orm'

/**
 * Converts a slug string into an object containing area slug, area ID,
 * a flag indicating if more areas can be added, and the path array.
 *
 * @param {Record<string, string>} params - The parameters containing the slug string.
 * @returns {Object} An object containing areaSlug, areaId, canAddArea, and path.
 * @throws Will throw an error if the last path item is null or if the area ID is not a number.
 */
export const convertAreaSlug = (params: Record<string, string>) => {
  const path = params.slugs.split('/')
  const lastPathItem = path.at(-1)

  if (lastPathItem == null) {
    error(404)
  }

  const slugItems = lastPathItem.split('-')
  const areaSlug = slugItems.slice(0, -1)
  const areaId = Number(slugItems.at(-1))
  const canAddArea = path.length < MAX_AREA_NESTING_DEPTH

  if (Number.isNaN(areaId)) {
    error(404)
  }

  return {
    areaSlug,
    areaId,
    canAddArea,
    path,
  }
}

export const getRouteDbFilter = (routeParam: string): SQL => {
  return Number.isNaN(Number(routeParam)) ? eq(routes.slug, routeParam) : eq(routes.id, Number(routeParam))
}

export const getUser = async (authUser: AuthUser | null): Promise<User | undefined> => {
  // Initialize a variable to store the user information
  let user: InferResultType<'users', { userSettings: { columns: { gradingScale: true } } }> | undefined

  // Check if the session contains a user with a valid email and name
  if (authUser?.email != null) {
    // Try to find the user in the database by their email
    user = await db.query.users.findFirst({
      where: eq(users.email, authUser.email),
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
      const [createdUser] = await db.insert(users).values({ email: authUser.email, userName: '' }).returning()

      const [createdUserSettings] = await db.insert(userSettings).values({ userFk: createdUser.id }).returning()
      await db.update(users).set({ userSettingsFk: createdUserSettings.id }).where(eq(users.id, createdUser.id))

      user = { ...createdUser, userSettings: { gradingScale: createdUserSettings.gradingScale } }
    }
  }

  return user
}
