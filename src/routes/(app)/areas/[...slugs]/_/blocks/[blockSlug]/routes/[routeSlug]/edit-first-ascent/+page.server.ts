import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { ascents, blocks, firstAscents, routes, users, type InsertFirstAscent } from '$lib/db/schema'
import { validateFirstAscentForm, type FirstAscentActionFailure, type FirstAscentActionValues } from '$lib/forms.server'
import { convertAreaSlug, getRouteDbFilter } from '$lib/helper.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve the areaId from the parent function
  const { areaId, user } = await parent()

  // Authenticate the user session
  const session = await locals.auth()
  if (session?.user == null) {
    // Throw a 401 error if the user is not authenticated
    error(401)
  }

  // Query the database to find the block with the specified slug and areaId
  const block = await db.query.blocks.findFirst({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    with: {
      routes: {
        where: getRouteDbFilter(params.routeSlug),
        with: {
          ascents: user == null ? { limit: 0 } : { where: eq(ascents.createdBy, user.id) },
          firstAscent: {
            // Include the climber information in the first ascent
            with: {
              climber: true,
            },
          },
        },
      },
    },
  })

  // Get the first route from the block's routes
  const route = block?.routes?.at(0)

  // Throw a 404 error if the route is not found
  if (route == null) {
    error(404)
  }

  // Throw a 400 error if multiple routes with the same slug are found
  if (block != null && block.routes.length > 1) {
    error(400, `Multiple routes with slug ${params.routeSlug} found`)
  }

  const firstAscentsResult = await db.query.firstAscents.findMany({
    orderBy: firstAscents.climberName,
    with: {
      climber: true,
    },
  })

  const allClimbers = firstAscentsResult
    .map((firstAscent) => firstAscent.climber?.userName ?? firstAscent.climberName)
    .filter((d): d is string => d != null)
  const climbersMap = allClimbers.reduce(
    (map, climber) => {
      return { ...map, [climber]: (map[climber] ?? 0) + 1 }
    },
    {} as Record<string, number>,
  )
  const climbers = Object.keys(climbersMap).sort((a, b) => climbersMap[b] - climbersMap[a])

  // Return the route and users data
  return {
    route,
    climbers,
  }
}) satisfies PageServerLoad

export const actions = {
  updateFirstAscent: async ({ locals, params, request }) => {
    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      // Throw a 401 error if the user is not authenticated
      error(401)
    }

    // Get the form data from the request
    const data = await request.formData()
    let values: FirstAscentActionValues

    try {
      // Validate the form data
      values = await validateFirstAscentForm(data)
    } catch (exception) {
      // Return the validation failure
      return exception as FirstAscentActionFailure
    }

    // Initialize the first ascent values
    const firstAscentValue: Omit<InsertFirstAscent, 'routeFk'> = {
      climberFk: null,
      climberName: null,
      year: null,
    }

    // Check if the climber name is provided and not empty
    if (values.climberName != null && values.climberName.length > 0) {
      // Query the database to find the user with the specified climber name
      const userResult = await db.query.users.findFirst({
        where: eq(users.userName, values.climberName),
      })

      if (userResult == null) {
        // If the user is not found, set the climber name
        firstAscentValue.climberName = values.climberName
      } else {
        // If the user is found, set the climber foreign key
        firstAscentValue.climberFk = userResult.id
      }
    }

    // Check if the year is provided and not empty
    if (values.year != null && String(values.year).length > 0) {
      // Set the year in the first ascent values
      firstAscentValue.year = values.year
    }

    // Query the database to find the block with the specified slug and areaId
    const block = await db.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        routes: {
          // Filter the routes to find the one with the specified slug
          where: getRouteDbFilter(params.routeSlug),
        },
      },
    })

    // Get the first route from the block's routes
    const route = block?.routes?.at(0)

    // Return a 404 error if the route is not found
    if (route == null) {
      return fail(404, { ...values, error: `Route not found ${params.routeSlug}` })
    }

    // Return a 400 error if multiple routes with the same slug are found
    if (block != null && block.routes.length > 1) {
      return fail(400, { ...values, error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    try {
      if (route.firstAscentFk == null) {
        // Insert the first ascent if it does not exist
        const firstAscentResult = await db
          .insert(firstAscents)
          .values({ ...firstAscentValue, routeFk: route.id })
          .returning()
        // Update the route with the first ascent foreign key
        await db.update(routes).set({ firstAscentFk: firstAscentResult[0].id }).where(eq(routes.id, route.id))
      } else {
        // Update the existing first ascent
        await db.update(firstAscents).set(firstAscentValue).where(eq(firstAscents.id, route.firstAscentFk))
      }
    } catch (exception) {
      // Return a 400 error if an exception occurs
      return fail(400, { ...values, error: convertException(exception) })
    }

    // Redirect to the route edit page
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}/routes/${params.routeSlug}`)
  },

  removeFirstAscent: async ({ locals, params, request }) => {
    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      // Throw a 401 error if the user is not authenticated
      error(401)
    }

    // Query the database to find the block with the specified slug and areaId
    const block = await db.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        routes: {
          // Filter the routes to find the one with the specified slug
          where: getRouteDbFilter(params.routeSlug),
        },
      },
    })

    // Get the first route from the block's routes
    const route = block?.routes?.at(0)

    // Return a 404 error if the route is not found
    if (route == null) {
      return fail(404, { error: `Route not found ${params.routeSlug}` })
    }

    // Return a 400 error if multiple routes with the same slug are found
    if (block != null && block.routes.length > 1) {
      return fail(400, { error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    if (route.firstAscentFk != null) {
      try {
        await db.delete(firstAscents).where(eq(firstAscents.id, route.firstAscentFk))
      } catch (error) {
        return fail(400, { error: convertException(error) })
      }
    }

    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}/routes/${params.routeSlug}`)
  },
}
