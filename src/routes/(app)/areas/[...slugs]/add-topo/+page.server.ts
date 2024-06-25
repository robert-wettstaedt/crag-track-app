import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { areas, files } from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { convertAreaSlug } from '$lib/helper.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  // Retrieve the areaId from the parent context
  const { areaId } = await parent()

  // Get the current session from locals
  const session = await locals.auth()

  // If the user is not authenticated, throw a 401 error
  if (session?.user == null) {
    error(401)
  }

  const nextcloud = getNextcloud(session)
  const stat = await nextcloud.getDirectoryContents(session.user.email + '/')
  console.log(stat)

  // Query the database for areas with the specified areaId
  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      files: true, // Include files associated with the area
    },
  })

  // Get the last area from the result
  const area = areasResult.at(-1)

  // If no area is found, throw a 404 error
  if (area == null) {
    error(404)
  }

  // Return the found area
  return {
    area,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      // If the user is not authenticated, throw a 401 error
      error(401)
    }

    // Retrieve form data from the request
    const data = await request.formData()
    const path = data.get('path')
    const values = { path }

    // Validate the path
    if (typeof path !== 'string' || path.length === 0) {
      return fail(400, { ...values, error: 'path is required' })
    }

    let stat: FileStat | undefined = undefined
    try {
      // Get the file statistics from Nextcloud
      stat = (await getNextcloud(session)?.stat(session.user.email + path)) as FileStat | undefined
    } catch (exception) {
      // If an error occurs, return a 400 error with the exception details
      return fail(400, { ...values, error: convertException(exception) })
    }

    // If the file statistics are not found, return a 400 error
    if (stat == null) {
      return fail(400, { ...values, error: 'Unable to read file' })
    }

    // If the path is a directory, return a 400 error
    if (stat.type === 'directory') {
      return fail(400, { ...values, error: 'path must be a file not a directory' })
    }

    try {
      // Insert the file information into the database
      await db.insert(files).values({ areaFk: areaId, path, type: 'topo' })
    } catch (exception) {
      // If the insertion fails, return a 404 error with the exception details
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the area page
    redirect(303, `/areas/${params.slugs}`)
  },
}
