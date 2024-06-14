import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { ascents, blocks, files, routes, users, type Ascent, type File } from '$lib/db/schema'
import { validateAscentForm, type AscentActionFailure, type AscentActionValues } from '$lib/forms.server'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Authenticate the user session
  const session = await locals.auth()
  if (session?.user == null) {
    // If no user is found in the session, throw a 401 Unauthorized error
    error(401)
  }

  // Query the database to find the block with the given slug and areaId
  const block = await db.query.blocks.findFirst({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    with: {
      routes: {
        where: eq(routes.slug, params.routeSlug),
      },
    },
  })

  // Get the first route from the block's routes
  const route = block?.routes?.at(0)

  // If no route is found, throw a 404 Not Found error
  if (route == null) {
    error(404)
  }

  // If multiple routes with the same slug are found, throw a 400 Bad Request error
  if (block != null && block.routes.length > 1) {
    error(400, `Multiple route with slug ${params.routeSlug} found`)
  }

  // Query the database to find the ascent with the given id
  const ascent = await db.query.ascents.findFirst({
    where: eq(ascents.id, Number(params.ascentId)),
    with: {
      author: true,
      files: true,
    },
  })

  // If no ascent is found, throw a 404 Not Found error
  if (ascent == null) {
    error(404)
  }

  // If the user is not the author of the ascent, throw a 401 Unauthorized error
  if (session.user.email !== ascent.author.email) {
    error(401)
  }

  // Return the ascent and route data
  return {
    ascent,
    route,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    // Convert area slug to areaId
    const { areaId } = convertAreaSlug(params)

    // Authenticate the user
    const session = await locals.auth()
    if (session?.user?.email == null) {
      error(401)
    }

    // Get form data from the request
    const data = await request.formData()
    let values: AscentActionValues

    // Validate the ascent form data
    try {
      values = await validateAscentForm(data)
    } catch (exception) {
      return exception as AscentActionFailure
    }

    // Query the database to find the block with the given slug and areaId
    const block = await db.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        routes: {
          where: eq(routes.slug, params.routeSlug),
        },
      },
    })

    // Get the first route from the block's routes
    const route = block?.routes?.at(0)

    // If no route is found, return a 404 error
    if (route == null) {
      return fail(404, { ...values, error: `Route not found ${params.routeSlug}` })
    }

    // If multiple routes with the same slug are found, return a 400 error
    if (block != null && block.routes.length > 1) {
      return fail(400, { ...values, error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    // Check if there are any file paths provided
    let hasFiles = false
    if (values.filePaths != null) {
      try {
        // Validate each file path
        await Promise.all(
          values.filePaths
            .filter((filePath) => filePath.trim().length > 0)
            .map(async (filePath) => {
              hasFiles = true
              const stat = (await getNextcloud(session)?.stat(session.user!.email + filePath)) as FileStat | undefined

              if (stat == null) {
                throw `Unable to read file: "${filePath}"`
              }

              if (stat.type === 'directory') {
                throw `path must be a file not a directory: "${filePath}"`
              }
            }),
        )
      } catch (exception) {
        return fail(400, { ...values, error: convertException(exception) })
      }
    }

    let ascent: Ascent
    try {
      // Find the user in the database
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      // Update the ascent in the database
      const results = await db
        .update(ascents)
        .set({ ...values, routeFk: route.id, createdBy: user.id })
        .where(eq(ascents.id, Number(params.ascentId)))
        .returning()
      ascent = results[0]
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    // If there are files, insert them into the database
    if (hasFiles) {
      try {
        const fileType: File['type'] = values.type === 'flash' ? 'send' : values.type

        await db.delete(files).where(eq(files.ascentFk, ascent.id))

        await db.insert(files).values(
          values
            .filePaths!.filter((filePath) => filePath.trim().length > 0)
            .map((filePath) => ({
              ascentFk: ascent.id,
              path: filePath,
              type: fileType,
            })),
        )
      } catch (exception) {
        return fail(400, { ...values, error: convertException(exception) })
      }
    }

    // Redirect to the merged path
    const mergedPath = ['areas', params.slugs, '_', 'blocks', params.blockSlug, 'routes', params.routeSlug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
