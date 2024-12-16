import { convertException } from '$lib'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { getUser } from '$lib/helper.server'
import { searchResources } from '$lib/search.server'

export const GET = async ({ locals, url }) => {
  if (!locals.userPermissions?.includes('data.read')) {
    return new Response(null, { status: 404 })
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)
  const user = await db((tx) => getUser(locals.user, tx))
  const query = url.searchParams.get('q')

  try {
    const result = await db((tx) => searchResources(query, user, tx))

    return new Response(JSON.stringify(result))
  } catch (exception) {
    const error = convertException(exception)
    return new Response(error, { status: 400 })
  }
}
