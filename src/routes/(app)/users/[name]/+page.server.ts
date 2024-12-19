import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { ascents, userSettings, users } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichRoute } from '$lib/db/utils'
import { convertException } from '$lib/errors'
import {
  userExternalResourceActionSchema,
  validate,
  type ActionFailure,
  type UserExternalResourceActionValues,
} from '$lib/forms.server'
import { error, fail } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Query the database to find users with the given name
  const usersResult = await db((tx) =>
    tx.query.users.findMany({
      where: eq(users.username, params.name),
    }),
  )

  // Get the first user from the result
  const user = usersResult.at(0)

  // If no user is found, throw a 404 error
  if (user == null) {
    error(404)
  }

  // If multiple users are found, throw a 400 error
  if (usersResult.length > 1) {
    error(400, `Multiple users with name ${params.name} found`)
  }

  const externalResources =
    user.authUserFk === locals.user?.id
      ? await db((tx) =>
          tx.query.userSettings.findFirst({
            where: eq(userSettings.userFk, user.id),
          }),
        )
      : null

  // Query the database to find ascents created by the user
  const ascentsResult = await db((tx) =>
    tx.query.ascents.findMany({
      where: eq(ascents.createdBy, user.id),
      with: {
        route: {
          with: {
            block: {
              with: {
                area: buildNestedAreaQuery(),
              },
            },
          },
        },
      },
    }),
  )

  // Get unique route IDs from the ascents result
  const routeIds = Array.from(new Set(ascentsResult.map((ascent) => ascent.routeFk)))

  // Find open projects by filtering and sorting ascents
  const openProjects = routeIds
    .flatMap((routeId) => {
      const ascents = ascentsResult
        .filter((ascent) => ascent.routeFk === routeId)
        .toSorted((a, b) => b.dateTime.localeCompare(a.dateTime))

      // If any ascent is not an attempt, exclude the route from open projects
      if (ascents.some((ascent) => ascent.type !== 'attempt')) {
        return []
      }

      // Return the route and its ascents
      return [{ route: { ...enrichRoute(ascents[0].route), ascents }, ascents }]
    })
    .toSorted((a, b) => {
      // Sort open projects by the number of ascents and the date of the last attempt
      if (a.ascents.length === b.ascents.length) {
        const aLastAttempt = a.ascents[0]
        const bLastAttempt = b.ascents[0]

        return bLastAttempt.dateTime.localeCompare(aLastAttempt.dateTime)
      }

      return b.ascents.length - a.ascents.length
    })

  // Find finished projects by filtering and sorting ascents
  const finishedProjects = routeIds
    .flatMap((routeId) => {
      const ascents = ascentsResult
        .filter((ascent) => ascent.routeFk === routeId && ascent.type !== 'repeat')
        .toSorted((a, b) => b.dateTime.localeCompare(a.dateTime))

      // If all ascents are attempts or there are less than 2 ascents, exclude the route from finished projects
      if (ascents.every((ascent) => ascent.type === 'attempt') || ascents.length < 2) {
        return []
      }

      // Return the route and its ascents
      return [{ route: { ...enrichRoute(ascents[0].route), ascents }, ascents }]
    })
    .toSorted((a, b) => {
      // Sort finished projects by the number of ascents and the date of the last attempt
      if (a.ascents.length === b.ascents.length) {
        const aLastAttempt = a.ascents[0]
        const bLastAttempt = b.ascents[0]

        return bLastAttempt.dateTime.localeCompare(aLastAttempt.dateTime)
      }

      return b.ascents.length - a.ascents.length
    })

  // Return the user, sends, open projects, and finished projects
  return {
    sends: ascentsResult.filter((ascent) => ascent.type !== 'attempt' && ascent.type !== 'repeat'),
    openProjects,
    finishedProjects,
    externalResources,
    requestedUser: user,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Query the database to find users with the given name
    const usersResult = await db((tx) =>
      tx.query.users.findMany({
        where: eq(users.username, params.name),
      }),
    )

    // Get the first user from the result
    const user = usersResult.at(0)

    // If no user is found, throw a 404 error
    if (user == null) {
      error(404)
    }

    // If multiple users are found, throw a 400 error
    if (usersResult.length > 1) {
      error(400, `Multiple users with name ${params.name} found`)
    }

    if (user.authUserFk !== locals.user?.id) {
      error(401)
    }

    const externalResources = await db((tx) =>
      tx.query.userSettings.findFirst({
        where: eq(userSettings.userFk, user.id),
      }),
    )

    // Get the form data from the request
    const data = await request.formData()
    let values: UserExternalResourceActionValues

    try {
      // Validate the form data
      values = await validate(userExternalResourceActionSchema, data)
    } catch (exception) {
      // If validation fails, return the exception as AreaActionFailure
      return exception as ActionFailure<UserExternalResourceActionValues>
    }

    try {
      if (externalResources == null) {
        const [result] = await db((tx) =>
          tx
            .insert(userSettings)
            .values({ authUserFk: user.authUserFk, userFk: user.id, ...values })
            .returning(),
        )
        await db((tx) => tx.update(users).set({ userSettingsFk: result.id }).where(eq(users.id, user.id)))
      } else {
        await db((tx) => tx.update(userSettings).set(values).where(eq(userSettings.id, externalResources.id)))
      }
    } catch (exception) {
      // If an error occurs during insertion, return a 400 error with the exception message
      return fail(400, { ...values, error: convertException(exception) })
    }

    return values
  },
}
