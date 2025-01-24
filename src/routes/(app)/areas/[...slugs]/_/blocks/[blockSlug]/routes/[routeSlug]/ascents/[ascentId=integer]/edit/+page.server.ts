import { EDIT_PERMISSION } from '$lib/auth'
import { createUpdateActivity } from '$lib/components/ActivityFeed/load.server'
import { handleFileUpload } from '$lib/components/FileUpload/handle.server'
import { config } from '$lib/config'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { activities, ascents, files } from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { ascentActionSchema, validateFormData, type ActionFailure, type AscentActionValues } from '$lib/forms.server'
import { getUser } from '$lib/helper.server'
import { deleteFile } from '$lib/nextcloud/nextcloud.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Query the database to find the ascent with the given id
  const ascent = await db((tx) =>
    tx.query.ascents.findFirst({
      where: eq(ascents.id, Number(params.ascentId)),
      with: {
        author: true,
        route: {
          with: {
            ascents: true,
          },
        },
      },
    }),
  )

  if (
    ascent == null ||
    (locals.user?.id !== ascent.author.authUserFk && !locals.userPermissions?.includes(EDIT_PERMISSION))
  ) {
    error(404)
  }

  // Return the ascent and route data
  return {
    ascent,
  }
}) satisfies PageServerLoad

export const actions = {
  updateAscent: async ({ locals, params, request }) => {
    const db = await createDrizzleSupabaseClient(locals.supabase)
    const user = await db((tx) => getUser(locals.user, tx))

    // Get form data from the request
    const data = await request.formData()
    let values: AscentActionValues

    // Validate the ascent form data
    try {
      values = await validateFormData(ascentActionSchema, data)
    } catch (exception) {
      return exception as ActionFailure<AscentActionValues>
    }

    const ascent = await db((tx) =>
      tx.query.ascents.findFirst({
        where: eq(ascents.id, Number(params.ascentId)),
        with: {
          author: true,
          route: true,
        },
      }),
    )

    if (
      ascent == null ||
      (locals.user?.id !== ascent.author.authUserFk && !locals.userPermissions?.includes(EDIT_PERMISSION))
    ) {
      return fail(404, { ...values, error: `Ascent not found ${params.ascentId}` })
    }

    try {
      // Update the ascent in the database
      await db((tx) =>
        tx
          .update(ascents)
          .set({ ...values, routeFk: ascent.route.id })
          .where(eq(ascents.id, ascent.id)),
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { folderName, ...rest } = values

      await db(async (tx) =>
        user == null
          ? null
          : createUpdateActivity({
              db: tx,
              entityId: ascent.id,
              entityType: 'ascent',
              newEntity: rest,
              oldEntity: ascent,
              userFk: user?.id,
              parentEntityId: ascent.route.id,
              parentEntityType: 'route',
            }),
      )
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    if (values.folderName != null) {
      try {
        const dstFolder = `${config.files.folders.userContent}/${locals.user?.id}`
        const createdFiles = await db((tx) =>
          handleFileUpload(tx, locals.supabase, values.folderName!, dstFolder, { ascentFk: ascent.id }),
        )

        await db(async (tx) =>
          Promise.all(
            createdFiles.map(({ file }) =>
              user == null
                ? null
                : tx.insert(activities).values({
                    type: 'uploaded',
                    userFk: user.id,
                    entityId: file.id,
                    entityType: 'file',
                    columnName: 'file',
                    parentEntityId: ascent.routeFk,
                    parentEntityType: 'route',
                  }),
            ),
          ),
        )
      } catch (exception) {
        // Return a 400 failure if file insertion fails
        return fail(400, { ...values, error: convertException(exception) })
      }
    }

    // Redirect to the merged path
    const mergedPath = ['areas', params.slugs, '_', 'blocks', params.blockSlug, 'routes', params.routeSlug].join('/')
    redirect(303, '/' + mergedPath + '#activity')
  },

  removeAscent: async ({ locals, params }) => {
    const db = await createDrizzleSupabaseClient(locals.supabase)
    const user = await db((tx) => getUser(locals.user, tx))
    const ascent = await db((tx) =>
      tx.query.ascents.findFirst({
        where: eq(ascents.id, Number(params.ascentId)),
        with: {
          author: true,
        },
      }),
    )

    if (
      ascent == null ||
      (locals.user?.id !== ascent.author.authUserFk && !locals.userPermissions?.includes(EDIT_PERMISSION))
    ) {
      return fail(404, { error: `Ascent not found ${params.ascentId}` })
    }

    try {
      await db((tx) => tx.delete(ascents).where(eq(ascents.id, ascent.id)))
      const filesToDelete = await db((tx) => tx.delete(files).where(eq(files.ascentFk, ascent.id)).returning())
      await Promise.all(filesToDelete.map((file) => deleteFile(file)))

      await db(async (tx) =>
        user == null
          ? null
          : tx.insert(activities).values({
              type: 'deleted',
              userFk: user.id,
              entityId: ascent.id,
              entityType: 'ascent',
              oldValue: ascent.type,
              parentEntityId: ascent.routeFk,
              parentEntityType: 'route',
            }),
      )
    } catch (error) {
      return fail(400, { error: convertException(error) })
    }

    // Redirect to the merged path
    const mergedPath = ['areas', params.slugs, '_', 'blocks', params.blockSlug, 'routes', params.routeSlug].join('/')
    redirect(303, '/' + mergedPath + '#activity')
  },
}
