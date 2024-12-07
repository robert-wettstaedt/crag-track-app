import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { searchResources } from '$lib/search.server'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, url, parent }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  const { user } = await parent()
  const query = url.searchParams.get('q')

  try {
    return await db((tx) => searchResources(query, user, tx))
  } catch (error) {
    return
  }
}) satisfies PageServerLoad
