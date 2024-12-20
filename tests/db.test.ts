import type { NestedArea, NestedBlock, NestedRoute } from '$lib/db/types'
import { buildNestedAreaQuery, enrichArea, enrichBlock, enrichRoute } from '$lib/db/utils'
import { describe, expect, it } from 'vitest'

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

  it('should build a nested area query with custom depth', () => {
    const query = buildNestedAreaQuery(2)
    expect(query).toEqual({
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
    })
  })

  it('should build a nested area query with depth 0', () => {
    const query = buildNestedAreaQuery(0)
    expect(query).toEqual({
      with: {
        parent: true,
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

  it('should handle deeply nested areas', () => {
    const area: NestedArea = {
      id: 1,
      slug: 'child-area',
      parent: {
        id: 2,
        slug: 'parent-area',
        parent: {
          id: 3,
          slug: 'grandparent-area',
          parent: {
            id: 4,
            slug: 'great-grandparent-area',
            parent: null,
          },
        },
      },
    }
    const enrichedArea = enrichArea(area)
    expect(enrichedArea.pathname).toBe('/areas/great-grandparent-area-4/grandparent-area-3/parent-area-2/child-area-1')
  })

  it('should preserve all area properties when enriching', () => {
    const area: NestedArea = {
      id: 1,
      slug: 'test-area',
      parent: null,
      name: 'Test Area',
      type: 'crag',
      createdAt: new Date(),
    }
    const enrichedArea = enrichArea(area)
    expect(enrichedArea).toEqual({
      ...area,
      pathname: '/areas/test-area-1',
    })
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

  it('should handle blocks in nested areas', () => {
    const block: NestedBlock = {
      id: 1,
      slug: 'test-block',
      area: {
        id: 2,
        slug: 'child-area',
        parent: {
          id: 3,
          slug: 'parent-area',
          parent: null,
        },
      },
    }
    const enrichedBlock = enrichBlock(block)
    expect(enrichedBlock.pathname).toBe('/areas/parent-area-3/child-area-2/_/blocks/test-block')
    expect(enrichedBlock.area.pathname).toBe('/areas/parent-area-3/child-area-2')
  })

  it('should preserve all block properties when enriching', () => {
    const block: NestedBlock = {
      id: 1,
      slug: 'test-block',
      name: 'Test Block',
      description: 'Test Description',
      createdAt: new Date(),
      area: {
        id: 2,
        slug: 'test-area',
        parent: null,
      },
    }
    const enrichedBlock = enrichBlock(block)
    expect(enrichedBlock).toEqual({
      ...block,
      pathname: '/areas/test-area-2/_/blocks/test-block',
      area: {
        ...block.area,
        pathname: '/areas/test-area-2',
      },
    })
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

  it('should handle routes in blocks in nested areas', () => {
    const route: NestedRoute = {
      id: 1,
      slug: 'test-route',
      block: {
        id: 2,
        slug: 'test-block',
        area: {
          id: 3,
          slug: 'child-area',
          parent: {
            id: 4,
            slug: 'parent-area',
            parent: null,
          },
        },
      },
    }
    const enrichedRoute = enrichRoute(route)
    expect(enrichedRoute.pathname).toBe('/areas/parent-area-4/child-area-3/_/blocks/test-block/routes/test-route')
    expect(enrichedRoute.block.pathname).toBe('/areas/parent-area-4/child-area-3/_/blocks/test-block')
    expect(enrichedRoute.block.area.pathname).toBe('/areas/parent-area-4/child-area-3')
  })

  it('should preserve all route properties when enriching', () => {
    const route: NestedRoute = {
      id: 1,
      slug: 'test-route',
      name: 'Test Route',
      description: 'Test Description',
      grade: 'V5',
      createdAt: new Date(),
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
    expect(enrichedRoute).toEqual({
      ...route,
      pathname: '/areas/test-area-3/_/blocks/test-block/routes/test-route',
      block: {
        ...route.block,
        pathname: '/areas/test-area-3/_/blocks/test-block',
        area: {
          ...route.block.area,
          pathname: '/areas/test-area-3',
        },
      },
    })
  })
})
