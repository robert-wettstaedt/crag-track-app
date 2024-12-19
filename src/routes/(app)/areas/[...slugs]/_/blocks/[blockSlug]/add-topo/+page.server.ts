import { NEXTCLOUD_USER_NAME } from '$env/static/private'
import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { blocks, files, topos } from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { convertAreaSlug } from '$lib/helper.server'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug } = await parent()

  // Query the database to find blocks matching the given slug and areaId
  const blocksResult = await db((tx) =>
    tx.query.blocks.findMany({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        files: {
          where: eq(files.type, 'topo'),
        },
      },
    }),
  )
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
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Query the database to find the first block matching the given slug and areaId
    const block = await db((tx) =>
      tx.query.blocks.findFirst({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
        with: {
          files: {
            where: eq(files.type, 'topo'),
          },
          topos: true,
        },
      }),
    )

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
      stat = (await getNextcloud()?.stat(NEXTCLOUD_USER_NAME + path)) as FileStat | undefined
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
      const [fileResult] = await db((tx) =>
        tx.insert(files).values({ blockFk: block.id, path, type: 'topo' }).returning(),
      )

      if (stat.mime?.includes('image')) {
        await db((tx) => tx.insert(topos).values({ blockFk: block.id, fileFk: fileResult.id }))
      }
    } catch (exception) {
      // If an exception occurs during insertion, return a failure response with the error message
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the block page after successful insertion
    redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
  },
}
