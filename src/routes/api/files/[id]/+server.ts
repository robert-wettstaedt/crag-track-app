import { DELETE_PERMISSION, EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { activities, files } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { getUser } from '$lib/helper.server'
import { deleteFile } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export async function DELETE({ locals, params }) {
  const rls = await createDrizzleSupabaseClient(locals.supabase)

  return await rls(async (db) => {
    const user = await getUser(locals.user, db)
    if (user == null) {
      error(404)
    }

    // Convert the file ID from the request parameters to a number
    const fileId = Number(params.id)

    // Initialize variables for file and user
    let file: InferResultType<'files', { area: true; ascent: true; block: true; route: true }> | undefined = undefined

    // Attempt to find the file in the database
    try {
      file = await db.query.files.findFirst({
        where: eq(files.id, fileId),
        with: {
          area: true,
          ascent: true,
          block: true,
          route: true,
        },
      })
    } catch (exception) {
      error(404)
    }

    // Determine the author ID from the file's related entities
    const authorId =
      file?.area?.createdBy ?? file?.ascent?.createdBy ?? file?.block?.createdBy ?? file?.route?.createdBy
    const entityId = file?.routeFk ?? file?.ascentFk ?? file?.blockFk ?? file?.areaFk
    const entityType =
      file?.routeFk != null ? 'route' : file?.ascentFk != null ? 'ascent' : file?.blockFk != null ? 'block' : 'area'

    if (
      (!locals.userPermissions?.includes(EDIT_PERMISSION) || !locals.userPermissions?.includes(DELETE_PERMISSION)) &&
      authorId !== user?.id
    ) {
      error(404)
    }

    // Delete the file from the database
    await db.delete(files).where(eq(files.id, fileId))
    if (file != null) {
      await deleteFile(file)
    }

    if (entityId != null) {
      await db.insert(activities).values({
        type: 'deleted',
        userFk: user.id,
        entityId: entityId,
        entityType: entityType,
        columnName: 'file',
      })
    }

    // Return a successful response
    return new Response(null, { status: 200 })
  })
}
