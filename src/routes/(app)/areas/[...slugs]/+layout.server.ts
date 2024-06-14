import { convertAreaSlug } from '$lib/slugs.server'
import type { LayoutServerLoad } from './$types'

export const load = (async ({ params }) => {
  return convertAreaSlug(params)
}) satisfies LayoutServerLoad
