import type { db } from './db.server'
import type { NestedArea, NestedBoulder, NestedCrag } from './types'

export const MAX_AREA_NESTING_DEPTH = 4

export const buildNestedAreaQuery = () => {
  let nestedAreaQuery: Parameters<typeof db.query.areas.findMany>[0] = {
    with: {
      parent: true,
    },
  }

  for (let i = 0; i < MAX_AREA_NESTING_DEPTH; i++) {
    nestedAreaQuery = {
      with: {
        parent: nestedAreaQuery,
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
    let parent = area.parent
    if (parent != null) {
      parent = recursive(parent as NestedArea)
    }

    slugs.push(area.slug)
    const pathname = ['', 'areas', ...slugs].join('/')
    return { ...area, parent, pathname }
  }

  if (area.parent == null) {
    return { ...area, pathname: ['', 'areas', area.slug].join('/') }
  } else {
    return recursive(area)
  }
}

export interface EnrichedCrag extends NestedCrag, WithPathname {}
export const enrichCrag = (crag: NestedCrag): EnrichedCrag => {
  const area = enrichArea(crag.area as NestedArea)

  const pathname = area.pathname + ['', '_', 'crags', crag.slug].join('/')
  return { ...crag, area, pathname }
}

export interface EnrichedBoulder extends NestedBoulder, WithPathname {}
export const enrichBoulder = (boulder: NestedBoulder): EnrichedBoulder => {
  try {
    const crag = enrichCrag(boulder.crag as NestedCrag)

    const pathname = crag.pathname + ['', 'boulders', boulder.slug].join('/')
    return { ...boulder, crag, pathname }
  } catch (error) {
    console.log('Unable to enrich boulder: ', boulder)
    throw error
  }
}
