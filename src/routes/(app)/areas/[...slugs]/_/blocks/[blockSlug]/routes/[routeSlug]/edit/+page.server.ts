import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { blocks, routes } from '$lib/db/schema'
import { validateRouteForm, type RouteActionFailure, type RouteActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Authenticate the user session
  const session = await locals.auth()
  if (session?.user == null) {
    error(401) // Throw an error if the user is not authenticated
  }

  // Query the database to find the block with the given slug and areaId
  const block = await db.query.blocks.findFirst({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    with: {
      routes: {
        where: eq(routes.slug, params.routeSlug), // Filter routes by the given routeSlug
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

  // Return the found route
  return {
    route,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      error(401) // Throw an error if the user is not authenticated
    }

    // Retrieve form data from the request
    const data = await request.formData()
    let values: RouteActionValues

    try {
      // Validate the form data
      values = await validateRouteForm(data)
    } catch (exception) {
      // Return the validation failure
      return exception as RouteActionFailure
    }

    // Query the database to find the block with the given slug and areaId
    const block = await db.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        routes: {
          where: eq(routes.slug, params.routeSlug), // Filter routes by the given routeSlug
        },
      },
    })

    // Get the first route from the block's routes
    const route = block?.routes?.at(0)

    // Return a 404 failure if the route is not found
    if (route == null) {
      return fail(404, { ...values, error: `Route not found ${params.routeSlug}` })
    }

    // Return a 400 failure if multiple routes with the same slug are found
    if (block != null && block.routes.length > 1) {
      return fail(400, { ...values, error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    try {
      // Update the route in the database with the validated values
      await db.update(routes).set(values).where(eq(routes.id, route.id))
    } catch (exception) {
      // Return a failure if the update operation fails
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the updated route's page
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}/routes/${params.routeSlug}`)
  },
}
