import { convertException } from '$lib'
import { db } from '$lib/db/db.server'
import { ascents, files, type File } from '$lib/db/schema'
import { validateAscentForm, type AscentActionFailure, type AscentActionValues } from '$lib/forms.server'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'
import { NEXTCLOUD_USER_NAME } from '$env/static/private'

export const load = (async ({ locals, params }) => {
  // Query the database to find the ascent with the given id
  const ascent = await db.query.ascents.findFirst({
    where: eq(ascents.id, Number(params.ascentId)),
    with: {
      author: true,
      files: true,
      route: {
        with: {
          ascents: true,
        },
      },
    },
  })

  // Authenticate the user
  if (locals.user?.email == null || locals.user.email !== ascent?.author.email) {
    error(401)
  }

  // If no ascent is found, throw a 404 Not Found error
  if (ascent == null) {
    error(404)
  }

  // If the user is not the author of the ascent, throw a 401 Unauthorized error
  if (locals.user.email !== ascent.author.email) {
    error(401)
  }

  // Return the ascent and route data
  return {
    ascent,
  }
}) satisfies PageServerLoad

export const actions = {
  updateAscent: async ({ locals, params, request }) => {
    // Get form data from the request
    const data = await request.formData()
    let values: AscentActionValues

    // Validate the ascent form data
    try {
      values = await validateAscentForm(data)
    } catch (exception) {
      return exception as AscentActionFailure
    }

    const ascent = await db.query.ascents.findFirst({
      where: eq(ascents.id, Number(params.ascentId)),
      with: {
        author: true,
        route: true,
      },
    })

    if (ascent == null) {
      return fail(404, { ...values, error: `Ascent not found ${params.ascentId}` })
    }

    if (locals.user?.email == null || locals.user.email !== ascent?.author.email) {
      error(401)
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
              const stat = (await getNextcloud(locals.session)?.stat(NEXTCLOUD_USER_NAME + filePath)) as
                | FileStat
                | undefined

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

    try {
      // Update the ascent in the database
      await db
        .update(ascents)
        .set({ ...values, routeFk: ascent.route.id })
        .where(eq(ascents.id, ascent.id))
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

  removeAscent: async ({ locals, params }) => {
    const ascent = await db.query.ascents.findFirst({
      where: eq(ascents.id, Number(params.ascentId)),
      with: {
        author: true,
      },
    })

    if (ascent == null) {
      return fail(404, { error: `Ascent not found ${params.ascentId}` })
    }

    if (locals.user?.email == null || locals.user.email !== ascent?.author.email) {
      error(401)
    }

    try {
      await db.delete(ascents).where(eq(ascents.id, ascent.id))
      await db.delete(files).where(eq(files.ascentFk, ascent.id))
    } catch (error) {
      return fail(400, { error: convertException(error) })
    }

    // Redirect to the merged path
    const mergedPath = ['areas', params.slugs, '_', 'blocks', params.blockSlug, 'routes', params.routeSlug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
