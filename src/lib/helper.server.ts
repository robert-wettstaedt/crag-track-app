import { error } from '@sveltejs/kit'
import { SQL, eq } from 'drizzle-orm'
import { routes } from './db/schema'
import { MAX_AREA_NESTING_DEPTH } from './db/utils'

/**
 * Converts a slug string into an object containing area slug, area ID,
 * a flag indicating if more areas can be added, and the path array.
 *
 * @param {Record<string, string>} params - The parameters containing the slug string.
 * @returns {Object} An object containing areaSlug, areaId, canAddArea, and path.
 * @throws Will throw an error if the last path item is null or if the area ID is not a number.
 */
export const convertAreaSlug = (params: Record<string, string>) => {
  const path = params.slugs.split('/')
  const lastPathItem = path.at(-1)

  if (lastPathItem == null) {
    error(404)
  }

  const slugItems = lastPathItem.split('-')
  const areaSlug = slugItems.slice(0, -1)
  const areaId = Number(slugItems.at(-1))
  const canAddArea = path.length < MAX_AREA_NESTING_DEPTH

  if (Number.isNaN(areaId)) {
    error(404)
  }

  return {
    areaSlug,
    areaId,
    canAddArea,
    path,
  }
}

export const getRouteDbFilter = (routeParam: string): SQL => {
  return Number.isNaN(Number(routeParam)) ? eq(routes.slug, routeParam) : eq(routes.id, Number(routeParam))
}
