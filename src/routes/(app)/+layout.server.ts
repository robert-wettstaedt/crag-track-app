import { db } from '$lib/db/db.server'
import { getUser } from '$lib/helper.server'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  const { user: authUser, session } = await locals.safeGetSession()
  const grades = await db.query.grades.findMany()
  const user = await getUser(authUser)

  return {
    cookies: cookies.getAll(),
    grades,
    session,
    user,
  }
}
