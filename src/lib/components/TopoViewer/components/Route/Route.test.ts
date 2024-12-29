import { selectedPointTypeStore, selectedRouteStore } from '$lib/components/TopoViewer/stores'
import type { TopoRouteDTO } from '$lib/topo'
import { fireEvent, render } from '@testing-library/svelte'
import { get } from 'svelte/store'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RouteView from './Route.svelte'

// Mock d3 functionality
vi.mock('d3', () => {
  const dragBehavior = {
    on: vi.fn((event, handler) => {
      if (event === 'drag') {
        dragBehavior.dragHandler = handler
      }
      return dragBehavior
    }),
    subject: vi.fn().mockReturnThis(),
  }

  return {
    select: vi.fn((element) => ({
      call: vi.fn((drag) => {
        // Store the drag behavior for testing
        element._drag = drag
      }),
    })),
    drag: vi.fn(() => dragBehavior),
  }
})

describe('RouteView Component', () => {
  const mockRoute: TopoRouteDTO = {
    id: 1,
    topType: 'top',
    routeFk: 1,
    topoFk: 1,
    points: [
      { id: '1', type: 'start', x: 100, y: 200 },
      { id: '2', type: 'middle', x: 150, y: 150 },
      { id: '3', type: 'top', x: 200, y: 100 },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    selectedPointTypeStore.set(null)
    selectedRouteStore.set(null)
  })

  describe('Rendering', () => {
    it('should render route lines correctly', () => {
      const { container } = render(RouteView, {
        props: {
          route: mockRoute,
          editable: false,
          height: 400,
          width: 600,
          scale: 1,
        },
      })

      const lines = container.querySelectorAll('line[data-id="line"]')
      // Each connection between points has 2 lines (background and foreground)
      expect(lines.length).toBe(4) // 2 connections * 2 lines
      expect(lines[0].getAttribute('data-route-id')).toBe('1')
    })

    it('should render points when route is selected', async () => {
      const { container } = render(RouteView, {
        props: {
          route: mockRoute,
          editable: true,
          height: 400,
          width: 600,
          scale: 1,
        },
      })

      selectedRouteStore.set(1)
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Start point has 3 circles, middle has 2, top has 2 lines
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(5)
    })

    it('should style points based on type', async () => {
      const { container } = render(RouteView, {
        props: {
          route: mockRoute,
          editable: true,
          height: 400,
          width: 600,
          scale: 1,
        },
      })

      selectedRouteStore.set(1)
      await new Promise((resolve) => setTimeout(resolve, 0))

      const startPoint = container.querySelector('#start')
      const middlePoint = container.querySelector('#middle')
      const topPoint = container.querySelector('#top-bg')

      expect(startPoint).not.toBeNull()
      expect(middlePoint).not.toBeNull()
      expect(topPoint).not.toBeNull()
    })
  })

  describe('Interactions', () => {
    it('should handle point dragging', async () => {
      const onChange = vi.fn()
      const { container } = render(RouteView, {
        props: {
          route: mockRoute,
          editable: true,
          height: 400,
          width: 600,
          scale: 1,
          onChange,
        },
      })

      selectedRouteStore.set(1)
      await new Promise((resolve) => setTimeout(resolve, 0))

      const group = container.querySelector('g')
      expect(group).not.toBeNull()

      // Get the d3 drag behavior
      const dragBehavior = (group as any)._drag
      expect(dragBehavior).toBeDefined()

      // Simulate drag event
      dragBehavior.dragHandler({
        dx: 10,
        dy: 10,
        sourceEvent: { preventDefault: vi.fn() },
      })

      expect(onChange).toHaveBeenCalled()
    })

    it('should handle point deletion', async () => {
      const onChange = vi.fn()
      const { container } = render(RouteView, {
        props: {
          route: mockRoute,
          editable: true,
          height: 400,
          width: 600,
          scale: 1,
          onChange,
        },
      })

      selectedRouteStore.set(1)
      await new Promise((resolve) => setTimeout(resolve, 0))

      const point = container.querySelector('#start')
      expect(point).not.toBeNull()

      // Simulate right click
      await fireEvent.contextMenu(point!)

      expect(onChange).toHaveBeenCalled()
      const updatedRoute = onChange.mock.calls[0][0]
      expect(updatedRoute.points).toHaveLength(2)
    })

    it('should handle route selection', async () => {
      const { container } = render(RouteView, {
        props: {
          route: mockRoute,
          editable: true,
          height: 400,
          width: 600,
          scale: 1,
        },
      })

      const group = container.querySelector('g')
      expect(group).not.toBeNull()

      // Simulate drag start event to trigger selection
      const dragBehavior = (group as any)._drag
      expect(dragBehavior).toBeDefined()

      dragBehavior.on.mock.calls.find(([event]) => event === 'start')[1]({
        sourceEvent: {
          preventDefault: vi.fn(),
          target: { attributes: { getNamedItem: () => ({ value: '1' }) } },
          type: '',
        },
      })

      expect(get(selectedRouteStore)).toBe(1)
    })
  })

  describe('Styling', () => {
    it('should apply selected styles when route is selected', async () => {
      const { container } = render(RouteView, {
        props: {
          route: mockRoute,
          editable: true,
          height: 400,
          width: 600,
          scale: 1,
        },
      })

      const lines = container.querySelectorAll('line[data-id="line"]')
      expect(lines.length).toBeGreaterThan(0)
      const foregroundLine = Array.from(lines).find((line) => line.getAttribute('opacity') === null)
      expect(foregroundLine).not.toBeNull()

      selectedRouteStore.set(1)
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(foregroundLine?.getAttribute('stroke')).toBe('white')
    })

    it('should handle different top types', () => {
      const routeWithTopout = {
        ...mockRoute,
        topType: 'topout' as const,
      }

      const { container } = render(RouteView, {
        props: {
          route: routeWithTopout,
          editable: true,
          height: 400,
          width: 600,
          scale: 1,
        },
      })

      const topout = container.querySelector('#topout')
      expect(topout).not.toBeNull()
    })
  })
})
