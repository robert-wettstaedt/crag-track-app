import { convertAreaSlug } from '$lib/helper.server'
import type { LayoutServerLoad } from './$types'

export const load = (async ({ params }) => {
  return convertAreaSlug(params)
}) satisfies LayoutServerLoad
