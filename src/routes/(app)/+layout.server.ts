import { createDrizzleSupabaseClient, db } from '$lib/db/db.server'
import { getUser } from '$lib/helper.server'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  const { session } = await locals.safeGetSession()
  const grades = await db.query.grades.findMany()
  const localDb = await createDrizzleSupabaseClient(locals.supabase)
  const user = await localDb((tx) => getUser(locals.user, tx))

  return {
    cookies: cookies.getAll(),
    grades,
    session,
    user,
  }
}
