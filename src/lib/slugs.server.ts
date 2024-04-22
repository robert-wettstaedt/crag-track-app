import { error } from '@sveltejs/kit'
import { MAX_AREA_NESTING_DEPTH } from './db/utils'

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
