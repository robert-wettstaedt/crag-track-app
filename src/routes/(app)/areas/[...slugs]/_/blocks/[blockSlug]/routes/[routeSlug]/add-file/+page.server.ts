import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { ascents, blocks, files, type File } from '$lib/db/schema'
import { convertAreaSlug, getRouteDbFilter } from '$lib/helper.server'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'
import { NEXTCLOUD_USER_NAME } from '$env/static/private'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve the areaId from the parent function
  const { areaId, user } = await parent()

  // Authenticate the user session
  const session = await locals.auth()
  if (session?.user == null) {
    // If the user is not authenticated, throw a 401 error
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
          files: {
            where: eq(files.type, 'topo'),
          },
        },
      },
    },
  })

  // Get the first route from the block's routes
  const route = block?.routes?.at(0)

  // If no route is found, throw a 404 error
  if (route == null) {
    error(404)
  }

  // If multiple routes with the same slug are found, throw a 400 error
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
    // Convert the area slug to an area ID
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      // If the user is not authenticated, throw a 401 error
      error(401)
    }

    // Retrieve form data from the request
    const data = await request.formData()

    // Extract the path and type from the form data
    const path = data.get('path')
    const type = data.get('type')

    // Store the extracted values in an object
    const values = { path, type }

    // Query the database to find the block with the specified slug and areaId
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

    // If no route is found, return a 404 error with the values and error message
    if (route == null) {
      return fail(404, { ...values, error: `Route not found ${params.routeSlug}` })
    }

    // If multiple routes with the same slug are found, return a 400 error with the values and error message
    if (block != null && block.routes.length > 1) {
      return fail(400, { ...values, error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    // Validate the path value
    if (typeof path !== 'string' || path.length === 0) {
      return fail(400, { ...values, error: 'path is required' })
    }

    // Validate the type value
    if (typeof type !== 'string' || type.length === 0) {
      return fail(400, { ...values, error: 'type is required' })
    }

    let stat: FileStat | undefined = undefined
    try {
      // Attempt to get the file statistics from Nextcloud
      stat = (await getNextcloud(session)?.stat(NEXTCLOUD_USER_NAME + path)) as FileStat | undefined
    } catch (exception) {
      // If an exception occurs, return a 400 error with the values and converted exception message
      return fail(400, { ...values, error: convertException(exception) })
    }

    // If the file statistics are not found, return a 400 error with the values and error message
    if (stat == null) {
      return fail(400, { ...values, error: 'Unable to read file' })
    }

    // If the path is a directory, return a 400 error with the values and error message
    if (stat.type === 'directory') {
      return fail(400, { ...values, error: 'path must be a file not a directory' })
    }

    try {
      // Insert the file information into the database
      await db.insert(files).values({
        routeFk: route.id,
        blockFk: type === 'topo' ? block?.id : undefined,
        path,
        type: type as File['type'],
      })
    } catch (exception) {
      // If an exception occurs during insertion, return a 404 error with the values and converted exception message
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the specified URL after successful insertion
    redirect(
      303,
      `/areas/${params.slugs}/_/blocks/${params.blockSlug}/routes/${route.slug.length === 0 ? route.id : route.slug}`,
    )
  },
}
