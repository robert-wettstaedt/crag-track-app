import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { blocks, generateSlug, routes, routesToTags, users } from '$lib/db/schema'
import { validateRouteForm, type RouteActionFailure, type RouteActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug } = await parent()

  // Authenticate the user session
  const session = await locals.auth()
  if (session?.user == null) {
    // If the user is not authenticated, throw a 401 error
    error(401)
  }

  // Query the database to find blocks matching the given slug and areaId
  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
  })
  // Get the first block from the result
  const block = blocksResult.at(0)

  // If no block is found, throw a 404 error
  if (block == null) {
    error(404)
  }

  // If multiple blocks are found, throw a 400 error with a descriptive message
  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  const tagsResult = await db.query.tags.findMany()

  // Return the found block
  return {
    block,
    tags: tagsResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    // Convert area slug to get areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user?.email == null) {
      // If the user is not authenticated, throw a 401 error
      error(401)
    }

    // Retrieve form data from the request
    const data = await request.formData()
    let values: RouteActionValues
    const { path } = convertAreaSlug(params)

    try {
      // Validate the form data
      values = await validateRouteForm(data)
    } catch (exception) {
      // If validation fails, return the exception as RouteActionFailure
      return exception as RouteActionFailure
    }

    // Generate a slug from the route name
    const slug = generateSlug(values.name)

    // Query the database to find the first block matching the given slug and areaId
    const block = await db.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    })

    // If no block is found, return a 400 error with a message
    if (block == null) {
      return fail(400, { ...values, error: `Parent not found ${params.blockSlug}` })
    }

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

    try {
      // Find the user in the database using their email
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        // If the user is not found, throw an error
        throw new Error('User not found')
      }

      const { tags, ...rest } = values

      // Insert the new route into the database
      const [route] = await db
        .insert(routes)
        .values({ ...rest, createdBy: user.id, blockFk: block.id, slug })
        .returning()

      if (tags.length > 0) {
        await db.insert(routesToTags).values(tags.map((tag) => ({ routeFk: route.id, tagFk: tag })))
      }
    } catch (exception) {
      // If the insertion fails, return a 400 error with the exception details
      return fail(400, { ...values, error: convertException(exception) })
    }

    // Construct the merged path for redirection
    const mergedPath = ['areas', ...path, '_', 'blocks', params.blockSlug, 'routes', slug].join('/')
    // Redirect to the new route's page
    redirect(303, '/' + mergedPath)
  },
}
