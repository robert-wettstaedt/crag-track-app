import type { db } from './db.server'
import type { NestedArea, NestedBoulder, NestedCrag } from './types'

export const MAX_AREA_NESTING_DEPTH = 4

export const buildNestedAreaQuery = () => {
  let nestedAreaQuery: Parameters<typeof db.query.areas.findMany>[0] = {
    with: {
      parentArea: true,
    },
  }

  for (let i = 0; i < MAX_AREA_NESTING_DEPTH; i++) {
    nestedAreaQuery = {
      with: {
        parentArea: nestedAreaQuery,
      },
    }
  }

  return nestedAreaQuery
}

interface WithPathname {
  pathname: string
}

export interface EnrichedArea extends NestedArea, WithPathname {}
export const enrichArea = (area: NestedArea): EnrichedArea => {
  const slugs: string[] = []

  const recursive = (area: NestedArea): EnrichedArea => {
    let parentArea = area.parentArea
    if (parentArea != null) {
      parentArea = recursive(parentArea as NestedArea)
    }

    slugs.push(area.slug)
    const pathname = ['areas', ...slugs].join('/')
    return { ...area, parentArea, pathname }
  }

  if (area.parentArea == null) {
    return { ...area, pathname: ['areas', area.slug].join('/') }
  } else {
    return recursive(area)
  }
}

export interface EnrichedCrag extends NestedCrag, WithPathname {}
export const enrichCrag = (crag: NestedCrag): EnrichedCrag => {
  const parentArea = enrichArea(crag.parentArea as NestedArea)

  const pathname = parentArea.pathname + ['', '_', 'crags', crag.slug].join('/')
  return { ...crag, parentArea, pathname }
}

export interface EnrichedBoulder extends NestedBoulder, WithPathname {}
export const enrichBoulder = (boulder: NestedBoulder): EnrichedBoulder => {
  const parentCrag = enrichCrag(boulder.parentCrag as NestedCrag)

  const pathname = parentCrag.pathname + ['', 'boulders', boulder.slug].join('/')
  return { ...boulder, parentCrag, pathname }
}
