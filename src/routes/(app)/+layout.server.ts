import { db } from '$lib/db/db.server'
import { getUser } from '$lib/helper.server'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.auth()
  const user = await getUser(session)
  const grades = await db.query.grades.findMany()

  return {
    grades,
    session,
    user,
  }
}
