import { db } from '$lib/db/db.server.js'
import { files, users, type User } from '$lib/db/schema.js'
import type { InferResultType } from '$lib/db/types'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export async function DELETE({ locals, params }) {
  const session = await locals.auth()
  if (session?.user?.email == null) {
    error(401, 'You are not logged in')
  }

  const fileId = Number(params.id)

  let file: InferResultType<'files', { ascent: true; route: true; block: true }> | undefined = undefined
  let user: User | undefined

  try {
    file = await db.query.files.findFirst({
      where: eq(files.id, fileId),
      with: {
        ascent: true,
        route: true,
        block: true,
      },
    })
  } catch (exception) {
    error(404)
  }

  try {
    user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })
  } catch (exception) {
    error(401, 'User not found')
  }

  const authorId = file?.route?.createdBy ?? file?.block?.createdBy ?? file?.ascent?.createdBy

  if (authorId !== user?.id) {
    error(401, 'You do not have permissions to delete this file')
  }

  await db.delete(files).where(eq(files.id, fileId))

  return new Response(null, { status: 200 })
}
