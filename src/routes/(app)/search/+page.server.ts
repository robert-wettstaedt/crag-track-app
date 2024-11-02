import { searchResources } from '$lib/search.server'
import type { PageServerLoad } from './$types'

export const load = (async ({ url, parent }) => {
  const { user } = await parent()
  const query = url.searchParams.get('q')

  try {
    return await searchResources(query, user)
  } catch (error) {
    return
  }
}) satisfies PageServerLoad
