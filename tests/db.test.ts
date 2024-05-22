import { describe, it, expect } from 'vitest'
import { buildNestedAreaQuery, enrichArea, enrichBlock, enrichRoute } from '../src/lib/db/utils'
import type { NestedArea, NestedBlock, NestedRoute } from '../src/lib/db/types'

describe('buildNestedAreaQuery', () => {
  it('should build a nested area query with the correct depth', () => {
    const query = buildNestedAreaQuery()
    expect(query).toEqual({
      with: {
        parent: {
          with: {
            parent: {
              with: {
                parent: {
                  with: {
                    parent: {
                      with: {
                        parent: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  })
})

describe('enrichArea', () => {
  it('should enrich a NestedArea object with a pathname', () => {
    const area: NestedArea = {
      id: 1,
      slug: 'test-area',
      parent: null,
    }
    const enrichedArea = enrichArea(area)
    expect(enrichedArea.pathname).toBe('/areas/test-area-1')
  })

  it('should recursively enrich a NestedArea object with a pathname', () => {
    const area: NestedArea = {
      id: 1,
      slug: 'child-area',
      parent: {
        id: 2,
        slug: 'parent-area',
        parent: null,
      },
    }
    const enrichedArea = enrichArea(area)
    expect(enrichedArea.pathname).toBe('/areas/parent-area-2/child-area-1')
  })
})

describe('enrichBlock', () => {
  it('should enrich a NestedBlock object with a pathname and enriched area', () => {
    const block: NestedBlock = {
      id: 1,
      slug: 'test-block',
      area: {
        id: 2,
        slug: 'test-area',
        parent: null,
      },
    }
    const enrichedBlock = enrichBlock(block)
    expect(enrichedBlock.pathname).toBe('/areas/test-area-2/_/blocks/test-block')
    expect(enrichedBlock.area.pathname).toBe('/areas/test-area-2')
  })
})

describe('enrichRoute', () => {
  it('should enrich a NestedRoute object with a pathname and enriched block', () => {
    const route: NestedRoute = {
      id: 1,
      slug: 'test-route',
      block: {
        id: 2,
        slug: 'test-block',
        area: {
          id: 3,
          slug: 'test-area',
          parent: null,
        },
      },
    }
    const enrichedRoute = enrichRoute(route)
    expect(enrichedRoute.pathname).toBe('/areas/test-area-3/_/blocks/test-block/routes/test-route')
    expect(enrichedRoute.block.pathname).toBe('/areas/test-area-3/_/blocks/test-block')
    expect(enrichedRoute.block.area.pathname).toBe('/areas/test-area-3')
  })
})
