import { db } from '$lib/db/db.server.js'
import { files, users, type User } from '$lib/db/schema.js'
import type { InferResultType } from '$lib/db/types'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export async function DELETE({ locals, params }) {
  const session = await locals.auth()
  if (session?.user?.email == null) {
    error(401)
  }

  const fileId = Number(params.id)

  let file: InferResultType<'files', { boulder: true; crag: true }> | undefined = undefined
  let user: User | undefined

  try {
    file = await db.query.files.findFirst({
      where: eq(files.id, fileId),
      with: {
        boulder: true,
        crag: true,
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
    error(401)
  }

  const authorId = file?.boulder?.createdBy ?? file?.crag?.createdBy

  if (authorId !== user?.id) {
    error(401)
  }

  await db.delete(files).where(eq(files.id, fileId))

  return new Response(null, { status: 200 })
}
