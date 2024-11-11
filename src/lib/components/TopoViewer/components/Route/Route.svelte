<script module lang="ts">
  export type Coordinates = Pick<PointDTO, 'x' | 'y'>

  export interface Line {
    from: Coordinates
    to: Coordinates
    length: number
  }
</script>

<script lang="ts">
  import { colorScheme, type PointDTO, type TopoRouteDTO } from '$lib/topo'
  import { createEventDispatcher, onMount } from 'svelte'
  import type { MouseEventHandler } from 'svelte/elements'
  import { highlightedRouteStore, selectedPointTypeStore, selectedRouteStore } from '../../stores'

  interface Props {
    key: number | undefined
    editable?: boolean
    route: TopoRouteDTO
    scale: number
    svg: SVGSVGElement
  }

  let { key, editable = false, route = $bindable(), scale, svg }: Props = $props()

  let selected = $derived($selectedRouteStore === route.routeFk)
  let highlighted = $derived($highlightedRouteStore === route.routeFk)

  let cursorClass = $derived(selected && editable ? 'cursor-move' : 'cursor-pointer')

  let color = $derived(key == null ? undefined : colorScheme[key])

  let strokeClass = $derived(highlighted ? 'stroke-green-400' : selected ? 'stroke-white' : 'stroke-red-700')
  let fillClass = $derived(highlighted ? 'fill-green-400' : selected ? 'fill-white' : 'fill-red-700')
  let strokeWidth = $derived(highlighted || selected ? 4 : 2)

  let bgStrokeClass = $derived('stroke-black opacity-50')
  let bgFillClass = $derived('fill-black opacity-50')
  let bgStrokeWidth = $derived(highlighted || selected ? 6 : 4)

  let selectedPoint: PointDTO | undefined = undefined
  let lines: Array<Line> = $state([])
  let center: Coordinates | undefined = $state(undefined)

  let prevEventPosition: Coordinates | undefined = undefined
  let isMoving = false

  const dispatcher = createEventDispatcher<{ change: TopoRouteDTO }>()

  const onSelect: MouseEventHandler<SVGGElement> = (event) => {
    if (!selected && $selectedPointTypeStore == null) {
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

  const calcCenter = () => {
    const totalLength = lines.reduce((total, line) => total + line.length, 0)
    let centerLength = totalLength / 2

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]

      if (centerLength > line.length) {
        centerLength -= line.length
        continue
      }

      const ratio = centerLength / line.length
      center = {
        x: (1 - ratio) * line.from.x + ratio * line.to.x,
        y: (1 - ratio) * line.from.y + ratio * line.to.y,
      }
      return
    }
  }

  const calcLines = () => {
    const startPoints = route.points.filter((point) => point.type === 'start')
    let startPoint: Coordinates | undefined = startPoints.at(0)
    lines = []

    if (startPoints.length === 2) {
      const [from, to] = startPoints

      lines = [...lines, { from, to, length: 0 }]
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

    const linesToAdd = [startPoint, ...nonStartPoints].flatMap((from, index, arr): Line[] => {
      const to = arr.at(index + 1)

      if (to == null) {
        return []
      }

      return [{ from, to, length: Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)) }]
    })

    lines = [...lines, ...linesToAdd]

    calcCenter()
  }

  const onClickSvg = (event: MouseEvent) => {
    const targetId = (event.target as HTMLElement).attributes.getNamedItem('data-id')?.value
    const selectedPoint = route.points.find((point) => point.id === targetId)

    if (selectedPoint == null) {
      selectedRouteStore.set(null)
    }

    isMoving = false
    prevEventPosition = undefined
  }

  const onContextMenuSvg = (event: MouseEvent) => {
    event.preventDefault()

    const targetId = (event.target as HTMLElement).attributes.getNamedItem('data-id')?.value
    const point = route.points.find((point) => point.id === targetId)

    if (!selected || point == null || !editable) {
      return
    }

    const points = route.points.filter((_point) => _point.id !== point.id)
    selectedPoint = undefined
    route.points = points
    dispatcher('change', route)
    calcLines()
  }

  const onMouseMoveSvg = (event: MouseEvent) => {
    if (!selected || event.buttons === 0 || !editable) {
      selectedPoint = undefined
      return
    }

    const targetId = (event.target as HTMLElement).attributes.getNamedItem('data-id')?.value
    const point = selectedPoint ?? route.points.find((point) => point.id === targetId)

    if (point != null) {
      isMoving = false
      prevEventPosition = undefined

      if (selectedPoint == null) {
        selectedPoint = point
      }

      point.x = Math.ceil(event.layerX / scale)
      point.y = Math.ceil(event.layerY / scale)

      route.points = route.points

      dispatcher('change', route)
    } else if (targetId === 'line') {
      isMoving = true
    }

    if (isMoving) {
      if (prevEventPosition != null) {
        const delta: Coordinates = {
          x: event.layerX - prevEventPosition.x,
          y: event.layerY - prevEventPosition.y,
        }

        route.points = route.points.map((point) => ({
          ...point,
          x: point.x + delta.x,
          y: point.y + delta.y,
        }))

        dispatcher('change', route)
      }

      prevEventPosition = { x: event.layerX, y: event.layerY }
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

  // $effect(() => {
  //   calcLines()
  // })
</script>

<g
  class="cursor-pointer"
  role="presentation"
  onclick={onSelect}
  onmouseover={onFocus}
  onmouseout={onBlur}
  onfocus={onFocus}
  onblur={onBlur}
>
  {#each lines as line}
    <line
      class={color == null ? bgStrokeClass : undefined}
      data-id="line"
      stroke={color}
      stroke-width={bgStrokeWidth}
      x1={line.from.x * scale}
      x2={line.to.x * scale}
      y1={line.from.y * scale}
      y2={line.to.y * scale}
    />

    <line
      class={color == null ? strokeClass : undefined}
      data-id="line"
      stroke={color}
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
        class={`${bgStrokeClass} ${cursorClass}`}
        cx={point.x * scale}
        cy={point.y * scale}
        data-id={point.id}
        fill="transparent"
        id="start-bg-outer"
        r={highlighted || selected ? 12 : 11}
        role="presentation"
      />

      <circle
        class={`${bgStrokeClass} ${cursorClass}`}
        cx={point.x * scale}
        cy={point.y * scale}
        data-id={point.id}
        fill="transparent"
        id="start-bg-inner"
        r={highlighted || selected ? 8 : 9}
        role="presentation"
      />

      <circle
        class={`${color == null ? strokeClass : ''} ${cursorClass}`}
        cx={point.x * scale}
        cy={point.y * scale}
        data-id={point.id}
        fill="transparent"
        id="start"
        r={10}
        role="presentation"
        stroke={color}
        stroke-width={strokeWidth}
      />
    {:else if point.type === 'middle'}
      <circle
        class={`${bgFillClass} ${cursorClass}`}
        cx={point.x * scale}
        cy={point.y * scale}
        data-id={point.id}
        fill="transparent"
        id="middle-bg"
        r={6}
      />

      <circle
        class={`${color == null ? fillClass : ''} ${cursorClass}`}
        cx={point.x * scale}
        cy={point.y * scale}
        data-id={point.id}
        fill={color}
        id="middle"
        r={5}
      />
    {:else if point.type === 'top'}
      {#if route.topType === 'topout'}
        <polyline
          class={`${bgStrokeClass} ${cursorClass}`}
          data-id={point.id}
          fill="transparent"
          id="topout-bg"
          points={`${point.x * scale - 20},${point.y * scale + 20} ${point.x * scale},${point.y * scale}, ${point.x * scale + 20},${point.y * scale + 20}`}
          stroke-width={bgStrokeWidth}
        />

        <polyline
          class={`${color == null ? strokeClass : ''} ${cursorClass}`}
          data-id={point.id}
          fill="transparent"
          id="topout"
          points={`${point.x * scale - 20},${point.y * scale + 20} ${point.x * scale},${point.y * scale}, ${point.x * scale + 20},${point.y * scale + 20}`}
          stroke={color}
          stroke-width={strokeWidth}
        />
      {:else}
        <line
          class={`${bgStrokeClass} ${cursorClass}`}
          data-id={point.id}
          fill="transparent"
          id="top-bg"
          stroke-width={bgStrokeWidth}
          x1={point.x * scale - 20}
          x2={point.x * scale + 20}
          y1={point.y * scale}
          y2={point.y * scale}
        />

        <line
          class={`${color == null ? strokeClass : ''} ${cursorClass}`}
          data-id={point.id}
          fill="transparent"
          id="top"
          stroke={color}
          stroke-width={strokeWidth}
          x1={point.x * scale - 20}
          x2={point.x * scale + 20}
          y1={point.y * scale}
          y2={point.y * scale}
        />
      {/if}
    {/if}
  {/each}

  {#if center != null && key != null}
    <rect
      class={bgFillClass}
      height={40 * scale}
      id="key-bg"
      width={40 * scale}
      x={center.x * scale - 50 * scale}
      y={center.y * scale - 60 * scale}
    />

    <text
      class={color == null ? fillClass : ''}
      fill={color}
      font-size={25 * scale}
      id="key"
      x={center.x * scale - 38 * scale}
      y={center.y * scale - 30 * scale}
    >
      {key}
    </text>
  {/if}
</g>
