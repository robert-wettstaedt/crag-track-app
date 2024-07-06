import type { InferResultType } from '$lib/db/types'
import { loadFiles } from '$lib/nextcloud/nextcloud.server'
import { convertPathToPoints, type TopoDTO, type TopoRouteDTO } from '$lib/topo'
import type { Session } from '@auth/sveltekit'
import type { db } from './db.server'
import type { NestedArea, NestedBlock, NestedRoute } from './types'

/**
 * The maximum depth for nesting areas.
 *
 * @constant {number}
 */
export const MAX_AREA_NESTING_DEPTH = 4

/**
 * Builds a nested area query with a specified maximum nesting depth.
 *
 * @returns {object} The nested area query object.
 */
export const buildNestedAreaQuery = (depth = MAX_AREA_NESTING_DEPTH) => {
  let nestedAreaQuery: Parameters<typeof db.query.areas.findMany>[0] = {
    with: {
      parent: true,
    },
  }

  for (let i = 0; i < depth; i++) {
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

/**
 * Enriches a NestedArea object by adding a pathname.
 *
 * @param {NestedArea} area - The area to enrich.
 * @returns {EnrichedArea} The enriched area with a pathname.
 */
export const enrichArea = (area: NestedArea): EnrichedArea => {
  const slugs: string[] = []

  const recursive = (area: NestedArea): EnrichedArea => {
    let parent = area.parent
    if (parent != null) {
      parent = recursive(parent as NestedArea)
    }

    slugs.push(`${area.slug}-${area.id}`)
    const pathname = ['', 'areas', ...slugs].join('/')
    return { ...area, parent, pathname }
  }

  if (area.parent == null) {
    return { ...area, pathname: ['', 'areas', `${area.slug}-${area.id}`].join('/') }
  } else {
    return recursive(area)
  }
}

export interface EnrichedBlock extends NestedBlock, WithPathname {}

/**
 * Enriches a NestedBlock object by adding a pathname and enriching its area.
 *
 * @param {NestedBlock} block - The block to enrich.
 * @returns {EnrichedBlock} The enriched block with a pathname and enriched area.
 */
export const enrichBlock = (block: NestedBlock): EnrichedBlock => {
  const area = enrichArea(block.area as NestedArea)

  const pathname = area.pathname + ['', '_', 'blocks', block.slug].join('/')
  return { ...block, area, pathname }
}

export interface EnrichedRoute extends NestedRoute, WithPathname {}

/**
 * Enriches a NestedRoute object by adding a pathname and enriching its block.
 *
 * @param {NestedRoute} route - The route to enrich.
 * @returns {EnrichedRoute} The enriched route with a pathname and enriched block.
 * @throws Will throw an error if the route cannot be enriched.
 */
export const enrichRoute = (route: NestedRoute): EnrichedRoute => {
  try {
    const block = enrichBlock(route.block as NestedBlock)

    const pathname = block.pathname + ['', 'routes', route.slug.length === 0 ? route.id : route.slug].join('/')
    return { ...route, block, pathname }
  } catch (error) {
    console.log('Unable to enrich route: ', route)
    throw error
  }
}

export const enrichTopo = async (
  topo: InferResultType<'topos', { file: true; routes: true }>,
  session: Session | null | undefined,
): Promise<TopoDTO> => {
  if (topo.file == null) {
    throw new Error('Topo file is required')
  }

  const [file] = await loadFiles([topo.file], session)

  const routes = topo.routes.map(({ path, ...route }): TopoRouteDTO => {
    return { ...route, points: convertPathToPoints(path ?? '') }
  })

  return { ...topo, file, routes }
}
