import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { crags, firstAscents, routes, users, type InsertFirstAscent } from '$lib/db/schema'
import { validateFirstAscentForm, type FirstAscentActionFailure, type FirstAscentActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const crag = await db.query.crags.findFirst({
    where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
    with: {
      routes: {
        where: eq(routes.slug, params.routeSlug),
        with: {
          firstAscent: {
            with: {
              climber: true,
            },
          },
        },
      },
    },
  })

  const route = crag?.routes?.at(0)

  if (route == null) {
    error(404)
  }

  if (crag != null && crag.routes.length > 1) {
    error(400, `Multiple routes with slug ${params.routeSlug} found`)
  }

  const usersResult = await db.query.users.findMany()

  return {
    route,
    users: usersResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const { areaId } = convertAreaSlug(params)

    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const data = await request.formData()
    let values: FirstAscentActionValues

    try {
      values = await validateFirstAscentForm(data)
    } catch (exception) {
      return exception as FirstAscentActionFailure
    }

    const firstAscentValue: Omit<InsertFirstAscent, 'routeFk'> = {
      climberFk: null,
      climberName: null,
      year: null,
    }

    if (values.climberName != null && values.climberName.length > 0) {
      const userResult = await db.query.users.findFirst({
        where: eq(users.userName, values.climberName),
      })

      if (userResult == null) {
        firstAscentValue.climberName = values.climberName
      } else {
        firstAscentValue.climberFk = userResult.id
      }
    }

    if (values.year != null && String(values.year).length > 0) {
      firstAscentValue.year = values.year
    }

    const crag = await db.query.crags.findFirst({
      where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
      with: {
        routes: {
          where: eq(routes.slug, params.routeSlug),
        },
      },
    })

    const route = crag?.routes?.at(0)

    if (route == null) {
      return fail(404, { ...values, error: `Route not found ${params.routeSlug}` })
    }

    if (crag != null && crag.routes.length > 1) {
      return fail(400, { ...values, error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    try {
      if (route.firstAscentFk == null) {
        const firstAscentResult = await db
          .insert(firstAscents)
          .values({ ...firstAscentValue, routeFk: route.id })
          .returning()
        await db.update(routes).set({ firstAscentFk: firstAscentResult[0].id }).where(eq(routes.id, route.id))
      } else {
        await db.update(firstAscents).set(firstAscentValue).where(eq(firstAscents.id, route.firstAscentFk))
      }
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}/routes/${params.routeSlug}`)
  },
}
