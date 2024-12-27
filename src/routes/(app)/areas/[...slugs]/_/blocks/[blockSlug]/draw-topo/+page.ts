import { load as loadClientLayout } from '$lib/layout/layout'
import type { PageLoad } from './$types'

export const load = (async (event) => {
  const layoutData = await loadClientLayout(event)
  return { ...event.data, ...layoutData }
}) satisfies PageLoad
