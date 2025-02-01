import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { userSettings } from '$lib/db/schema'
import { getUser } from '$lib/helper.server'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export async function POST({ locals, url }) {
  const rls = await createDrizzleSupabaseClient(locals.supabase)

  return await rls(async (db) => {
    const user = await getUser(locals.user, db)
    if (user == null) {
      error(404)
    }

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
  })
}
