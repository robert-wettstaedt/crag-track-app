import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { blocks, generateSlug, routes, routesToTags } from '$lib/db/schema'
import { validateRouteForm, type RouteActionFailure, type RouteActionValues } from '$lib/forms.server'
import { convertAreaSlug, getRouteDbFilter } from '$lib/helper.server'
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
        where: getRouteDbFilter(params.routeSlug),
        with: {
          tags: true,
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

  const tagsResult = await db.query.tags.findMany()

  // Return the found route
  return {
    route,
    tags: tagsResult,
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
          where: getRouteDbFilter(params.routeSlug),
        },
      },
    })

    // Get the first route from the block's routes
    const route = block?.routes?.at(0)

    // Return a 404 failure if the route is not found
    if (route == null) {
      return fail(404, { ...values, error: `Route not found ${params.routeSlug}` })
    }

    // If no block is found, return a 400 error with a message
    if (block == null) {
      return fail(400, { ...values, error: `Parent not found ${params.blockSlug}` })
    }

    // Return a 400 failure if multiple routes with the same slug are found
    if (block.routes.length > 1) {
      return fail(400, { ...values, error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    // Generate a slug from the route name
    const slug = generateSlug(values.name)

    if (slug.length > 0) {
      // Query the database to check if a route with the same slug already exists in the block
      const existingRoutesResult = await db
        .select()
        .from(routes)
        .where(and(eq(routes.slug, slug), eq(routes.blockFk, block.id)))

      // If a route with the same slug exists, return a 400 error with a message
      if (existingRoutesResult.length > 0) {
        return fail(400, {
          ...values,
          error: `Route with name "${existingRoutesResult[0].name}" already exists in block "${block.name}"`,
        })
      }
    }

    try {
      const { tags, ...rest } = values

      // Update the route in the database with the validated values
      await db
        .update(routes)
        .set({ ...rest, slug })
        .where(eq(routes.id, route.id))

      // Delete existing route-to-tag associations for the route
      await db.delete(routesToTags).where(eq(routesToTags.routeFk, route.id))

      if (tags.length > 0) {
        // Insert new route-to-tag associations for the route
        await db.insert(routesToTags).values(tags.map((tag) => ({ routeFk: route.id, tagFk: tag })))
      }
    } catch (exception) {
      // Return a failure if the update operation fails
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the updated route's page
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}/routes/${slug.length === 0 ? route.id : slug}`)
  },
}
