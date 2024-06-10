<script context="module" lang="ts">
  export type Coordinates = Pick<PointDTO, 'x' | 'y'>

  export interface Line {
    from: Coordinates
    to: Coordinates
  }
</script>

<script lang="ts">
  import type { PointDTO, RouteDTO } from '$lib/topo'
  import { afterUpdate, createEventDispatcher, onMount } from 'svelte'
  import type { MouseEventHandler } from 'svelte/elements'
  import { highlightedRouteStore, selectedRouteStore } from '../../stores'

  export let route: RouteDTO
  export let scale: number
  export let svg: SVGSVGElement

  $: selected = $selectedRouteStore === route.routeFk
  $: highlighted = $highlightedRouteStore === route.routeFk

  $: strokeClass = highlighted ? 'stroke-green-400' : selected ? 'stroke-white' : 'stroke-red-700'
  $: fillClass = highlighted ? 'fill-green-400' : selected ? 'fill-white' : 'fill-red-700'
  $: strokeWidth = highlighted || selected ? 4 : 2

  let selectedPoint: PointDTO | undefined = undefined
  let lines: Array<Line> = []

  const dispatcher = createEventDispatcher<{ change: RouteDTO }>()

  const onSelect: MouseEventHandler<SVGGElement> = (event) => {
    if (!selected) {
      event.stopImmediatePropagation()
      selectedRouteStore.set(route.routeFk)
      highlightedRouteStore.set(null)
    }
  }

  const onFocus = () => {
    if (!selected) {
      highlightedRouteStore.set(route.routeFk)
    }
  }

  const onBlur = () => {
    highlightedRouteStore.set(null)
  }

  const calcLines = () => {
    const startPoints = route.points.filter((point) => point.type === 'start')
    let startPoint: Coordinates | undefined = startPoints.at(0)
    lines = []

    if (startPoints.length === 2) {
      const [from, to] = startPoints

      lines = [...lines, { from, to }]
      startPoint = {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
      }
    }

    if (startPoint == null) {
      return
    }

    const nonStartPoints = route.points
      .filter((point) => point.type !== 'start')
      .toSorted((a, b) => {
        const aDist = Math.sqrt(Math.pow(startPoint.x - a.x, 2) + Math.pow(startPoint.y - a.y, 2))
        const bDist = Math.sqrt(Math.pow(startPoint.x - b.x, 2) + Math.pow(startPoint.y - b.y, 2))

        return aDist - bDist
      })

    const linesToAdd = [startPoint, ...nonStartPoints].flatMap((curr, index, arr): Line[] => {
      const next = arr.at(index + 1)

      if (next == null) {
        return []
      }

      return [{ from: curr, to: next }]
    })

    lines = [...lines, ...linesToAdd]
  }

  const onClickSvg = (event: MouseEvent) => {
    const selectedPoint = route.points.find((point) => point.id === (event.target as HTMLElement).id)

    if (selectedPoint == null) {
      selectedRouteStore.set(null)
    }
  }

  const onContextMenuSvg = (event: MouseEvent) => {
    event.preventDefault()

    const point = route.points.find((point) => point.id === (event.target as HTMLElement).id)

    if (!selected || point == null) {
      return
    }

    const points = route.points.filter((_point) => _point.id !== point.id)
    selectedPoint = undefined
    route.points = points
    dispatcher('change', route)
    calcLines()
  }

  const onMouseMoveSvg = (event: MouseEvent) => {
    if (!selected || event.buttons === 0) {
      selectedPoint = undefined
      return
    }

    const point = selectedPoint ?? route.points.find((point) => point.id === (event.target as HTMLElement).id)

    if (point != null) {
      if (selectedPoint == null) {
        selectedPoint = point
      }

      point.x = Math.ceil(event.layerX / scale)
      point.y = Math.ceil(event.layerY / scale)

      route.points = route.points

      dispatcher('change', route)
      calcLines()
    }
  }

  onMount(() => {
    svg.addEventListener('click', onClickSvg)
    svg.addEventListener('contextmenu', onContextMenuSvg)
    svg.addEventListener('mousemove', onMouseMoveSvg)
    calcLines()

    return () => {
      svg.removeEventListener('click', onClickSvg)
      svg.removeEventListener('contextmenu', onContextMenuSvg)
      svg.removeEventListener('mousemove', onMouseMoveSvg)
    }
  })

  afterUpdate(() => {
    calcLines()
  })
</script>

<g
  class="cursor-pointer"
  role="presentation"
  on:click={onSelect}
  on:mouseover={onFocus}
  on:mouseout={onBlur}
  on:focus={onFocus}
  on:blur={onBlur}
>
  {#each lines as line}
    <line
      class={strokeClass}
      stroke-width={strokeWidth}
      x1={line.from.x * scale}
      x2={line.to.x * scale}
      y1={line.from.y * scale}
      y2={line.to.y * scale}
    />
  {/each}

  {#each route.points as point}
    {#if point.type === 'start'}
      <circle
        class={`${strokeClass} ${selected ? 'cursor-move' : 'cursor-pointer'}`}
        cx={point.x * scale}
        cy={point.y * scale}
        fill="transparent"
        id={point.id}
        r={10}
        role="presentation"
        stroke-width={strokeWidth}
      />
    {:else if point.type === 'middle'}
      <circle
        class={`${fillClass} ${selected ? 'cursor-move' : 'cursor-pointer'}`}
        cx={point.x * scale}
        cy={point.y * scale}
        id={point.id}
        r={5}
      />
    {:else if point.type === 'top'}
      {#if route.topType === 'topout'}
        <polyline
          class={`${strokeClass} ${selected ? 'cursor-move' : 'cursor-pointer'}`}
          fill="transparent"
          id={point.id}
          stroke-width={strokeWidth}
          points={`${point.x * scale - 20},${point.y * scale + 20} ${point.x * scale},${point.y * scale}, ${point.x * scale + 20},${point.y * scale + 20}`}
        />
      {:else}
        <line
          class={`${strokeClass} ${selected ? 'cursor-move' : 'cursor-pointer'}`}
          fill="transparent"
          id={point.id}
          stroke-width={strokeWidth}
          x1={point.x * scale - 20}
          x2={point.x * scale + 20}
          y1={point.y * scale}
          y2={point.y * scale}
        />
      {/if}
    {/if}
  {/each}
</g>
