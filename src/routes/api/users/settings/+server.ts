import { db } from '$lib/db/db.server'
import { users, userSettings } from '$lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST({ locals, url }) {
  const session = await locals.auth()

  if (session?.user?.email == null) {
    return new Response(null, { status: 401 })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  })

  if (user == null) {
    return new Response(null, { status: 404 })
  }

  const gradingScale = url.searchParams.get('gradingScale')

  if (gradingScale == null) {
    return new Response('`gradingScale` is required', { status: 400 })
  }

  if (gradingScale !== 'FB' && gradingScale !== 'V') {
    return new Response('`gradingScale` must be either `FB` or `V`', { status: 400 })
  }

  await db.update(userSettings).set({ gradingScale }).where(eq(userSettings.userFk, user.id))

  return new Response(null, { status: 200 })
}
