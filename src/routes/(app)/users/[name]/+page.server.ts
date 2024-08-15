import { db } from '$lib/db/db.server'
import { ascents, users } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichRoute } from '$lib/db/utils'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  // Query the database to find users with the given name
  const usersResult = await db.query.users.findMany({
    where: eq(users.userName, params.name),
  })

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

  // Query the database to find ascents created by the user
  const ascentsResult = await db.query.ascents.findMany({
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
  })

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
    user,
    sends: ascentsResult.filter((ascent) => ascent.type !== 'attempt' && ascent.type !== 'repeat'),
    openProjects,
    finishedProjects,
  }
}) satisfies PageServerLoad
