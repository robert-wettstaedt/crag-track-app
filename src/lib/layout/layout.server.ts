import { createDrizzleSupabaseClient, db } from '$lib/db/db.server'
import type { UserSettings } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { getUser } from '$lib/helper.server'
import type { ServerLoadEvent } from '@sveltejs/kit'

export const load = async ({ locals, cookies }: ServerLoadEvent) => {
  const { session, user: authUser } = await locals.safeGetSession()
  const grades = await db.query.grades.findMany()
  const localDb = await createDrizzleSupabaseClient(locals.supabase)
  const user = await localDb((tx) => getUser(locals.user, tx))
  const gradingScale: UserSettings['gradingScale'] = user?.userSettings?.gradingScale ?? 'FB'

  const blocks = await localDb((tx) =>
    tx.query.blocks.findMany({
      where: (table, { isNotNull }) => isNotNull(table.geolocationFk),
      with: {
        area: buildNestedAreaQuery(),
        geolocation: true,
      },
    }),
  )
  const enrichedBlocks = blocks.map(enrichBlock)

  return {
    authUser,
    blocks: enrichedBlocks,
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
