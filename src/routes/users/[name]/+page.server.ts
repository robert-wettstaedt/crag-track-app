import { db } from '$lib/db/db.server'
import { ascents, users } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichRoute } from '$lib/db/utils'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const usersResult = await db.query.users.findMany({
    where: eq(users.userName, params.name),
  })

  const user = usersResult.at(0)

  if (user == null) {
    error(404)
  }

  if (usersResult.length > 1) {
    error(400, `Multiple users with name ${params.name} found`)
  }

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

  const routeIds = Array.from(new Set(ascentsResult.map((ascent) => ascent.routeFk)))
  const openProjects = routeIds
    .flatMap((routeId) => {
      const ascents = ascentsResult
        .filter((ascent) => ascent.routeFk === routeId)
        .toSorted((a, b) => b.dateTime.localeCompare(a.dateTime))

      if (ascents.some((ascent) => ascent.type !== 'attempt')) {
        return []
      }

      return [{ route: enrichRoute(ascents[0].route), ascents }]
    })
    .toSorted((a, b) => {
      if (a.ascents.length === b.ascents.length) {
        const aLastAttempt = a.ascents[0]
        const bLastAttempt = b.ascents[0]

        return bLastAttempt.dateTime.localeCompare(aLastAttempt.dateTime)
      }

      return b.ascents.length - a.ascents.length
    })

  const finishedProjects = routeIds
    .flatMap((routeId) => {
      const ascents = ascentsResult
        .filter((ascent) => ascent.routeFk === routeId && ascent.type !== 'repeat')
        .toSorted((a, b) => b.dateTime.localeCompare(a.dateTime))

      if (ascents.every((ascent) => ascent.type === 'attempt') || ascents.length < 2) {
        return []
      }

      return [{ route: enrichRoute(ascents[0].route), ascents }]
    })
    .slice(0, 10)
    .toSorted((a, b) => {
      if (a.ascents.length === b.ascents.length) {
        const aLastAttempt = a.ascents[0]
        const bLastAttempt = b.ascents[0]

        return bLastAttempt.dateTime.localeCompare(aLastAttempt.dateTime)
      }

      return b.ascents.length - a.ascents.length
    })

  return {
    user,
    sends: ascentsResult.filter((ascent) => ascent.type !== 'attempt'),
    openProjects,
    finishedProjects,
  }
}) satisfies PageServerLoad
