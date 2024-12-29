import { createDrizzleSupabaseClient, db } from '$lib/db/db.server'
import type { UserSettings } from '$lib/db/schema'
import { getUser } from '$lib/helper.server'
import type { ServerLoadEvent } from '@sveltejs/kit'

export const load = async ({ locals, cookies }: ServerLoadEvent) => {
  const { session } = await locals.safeGetSession()
  const grades = await db.query.grades.findMany()
  const localDb = await createDrizzleSupabaseClient(locals.supabase)
  const user = await localDb((tx) => getUser(locals.user, tx))
  const gradingScale: UserSettings['gradingScale'] = user?.userSettings?.gradingScale ?? 'FB'

  return {
    cookies: cookies.getAll(),
    grades,
    gradingScale,
    session,
    user,
    userPermissions: locals.userPermissions,
    userRole: locals.userRole,
  }
}

export type Data = Awaited<ReturnType<typeof load>>
