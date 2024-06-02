import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { blocks, files } from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug } = await parent()

  // Authenticate the user session
  const session = await locals.auth()
  if (session?.user == null) {
    // If no user is found in the session, throw a 401 error
    error(401)
  }

  // Query the database to find blocks matching the given slug and areaId
  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    with: {
      files: {
        where: eq(files.type, 'topo'),
      },
    },
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

  // Return the block data
  return {
    block: block,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user session
    const session = await locals.auth()
    if (session?.user == null) {
      // If no user is found in the session, throw a 401 error
      error(401)
    }

    // Query the database to find the first block matching the given slug and areaId
    const block = await db.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        files: {
          where: eq(files.type, 'topo'),
        },
      },
    })

    // If no block is found, throw a 404 error
    if (block == null) {
      error(404)
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
      // Get file statistics from Nextcloud
      stat = (await getNextcloud(session)?.stat(session.user.email + path)) as FileStat | undefined
    } catch (exception) {
      // If an exception occurs, return a failure response with the error message
      return fail(400, { ...values, error: convertException(exception) })
    }

    // If the file statistics are not found, return a failure response
    if (stat == null) {
      return fail(400, { ...values, error: 'Unable to read file' })
    }

    // If the path is a directory, return a failure response
    if (stat.type === 'directory') {
      return fail(400, { ...values, error: 'path must be a file not a directory' })
    }

    try {
      // Insert the file information into the database
      await db.insert(files).values({ blockFk: block.id, path, type: 'topo' })
    } catch (exception) {
      // If an exception occurs during insertion, return a failure response with the error message
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the block page after successful insertion
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
  },
}
