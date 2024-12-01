import { db } from '$lib/db/db.server'
import { files, users, type User } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export async function DELETE({ locals, params }) {
  if (locals.user?.email == null) {
    error(401, 'You are not logged in')
  }

  // Convert the file ID from the request parameters to a number
  const fileId = Number(params.id)

  // Initialize variables for file and user
  let file: InferResultType<'files', { area: true; ascent: true; block: true; route: true }> | undefined = undefined
  let user: User | undefined

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

  // Attempt to find the user in the database
  try {
    user = await db.query.users.findFirst({
      where: eq(users.email, locals.user.email),
    })
  } catch (exception) {
    error(401, 'User not found')
  }

  // Determine the author ID from the file's related entities
  const authorId = file?.area?.createdBy ?? file?.ascent?.createdBy ?? file?.block?.createdBy ?? file?.route?.createdBy

  // Check if the authenticated user is the author of the file
  if (authorId !== user?.id) {
    error(401, 'You do not have permissions to delete this file')
  }

  // Delete the file from the database
  await db.delete(files).where(eq(files.id, fileId))

  // Return a successful response
  return new Response(null, { status: 200 })
}
