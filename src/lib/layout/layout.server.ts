import { createDrizzleSupabaseClient, db } from '$lib/db/db.server'
import { getUser } from '$lib/helper.server'
import type { ServerLoadEvent } from '@sveltejs/kit'

export const load = async ({ locals, cookies }: ServerLoadEvent) => {
  const { session } = await locals.safeGetSession()
  const grades = await db.query.grades.findMany()
  const localDb = await createDrizzleSupabaseClient(locals.supabase)
  const user = await localDb((tx) => getUser(locals.user, tx))

  return {
    cookies: cookies.getAll(),
    grades,
    session,
    user,
    userPermissions: locals.userPermissions,
    userRole: locals.userRole,
  }
}

export type Data = Awaited<ReturnType<typeof load>>
