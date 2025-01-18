import { loadFeed } from '$lib/components/ActivityFeed/load.server'

export const load = async (event) => {
  return { feed: await loadFeed(event) }
}
