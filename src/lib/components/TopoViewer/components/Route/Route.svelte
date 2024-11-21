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
  import * as d3 from 'd3'
  import { onMount } from 'svelte'
  import { highlightedRouteStore, selectedPointTypeStore, selectedRouteStore } from '../../stores'
  import { calcCenter, calcLines } from './lib'

  interface Props {
    key: number | undefined
    editable?: boolean
    onChange?: (route: TopoRouteDTO) => void
    route: TopoRouteDTO
    routes: TopoRouteDTO[]
    scale: number
    height: number
    width: number
  }

  let { key, editable = false, onChange, route = $bindable(), routes, scale, height, width }: Props = $props()

  let group: SVGGElement | undefined = $state()

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

  let selectedPoint: PointDTO | undefined = $state(undefined)

  let lines = $derived(calcLines(route.points))
  let center = $derived(calcCenter(lines))

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault()

    const targetId = (event.target as HTMLElement).attributes.getNamedItem('data-id')?.value
    const point = route.points.find((point) => point.id === targetId)

    if (!selected || point == null || !editable) {
      return
    }

    route.points = route.points.filter((_point) => _point.id !== point.id)
    selectedPoint = undefined
    onChange?.(route)
  }

  onMount(() => {
    if (group != null) {
      const drag = d3
        .drag()
        .on('start', (event) => {
          event.sourceEvent.preventDefault()

          const targetId = (event.sourceEvent.target as Element).attributes.getNamedItem('data-id')?.value
          selectedPoint = route.points.find((point) => point.id === targetId)

          if (!selected && $selectedPointTypeStore == null) {
            selectedRouteStore.set(route.routeFk)
            highlightedRouteStore.set(null)
          }
        })
        .on('drag', (event) => {
          if (!editable) {
            return
          }

          const points = selectedPoint == null ? route.points : [selectedPoint]

          const correction = points.reduce(
            (r, point) => {
              const pos = {
                x: point.x + event.dx,
                y: point.y + event.dy,
              }
              const norm = {
                x: Math.min(Math.max(0, pos.x), width / scale),
                y: Math.min(Math.max(0, pos.y), height / scale),
              }
              const diff = {
                x: norm.x - pos.x,
                y: norm.y - pos.y,
              }
              return r == null
                ? diff
                : {
                    x: Math.abs(diff.x) > Math.abs(r.x) ? diff.x : r.x,
                    y: Math.abs(diff.y) > Math.abs(r.y) ? diff.y : r.y,
                  }
            },
            null as Coordinates | null,
          )

          points.forEach((point) => {
            point.x = Math.round(point.x + event.dx + (correction?.x ?? 0))
            point.y = Math.round(point.y + event.dy + (correction?.y ?? 0))
          })

          onChange?.(route)
        })
        .on('end', () => {
          selectedPoint = undefined
        })

      d3.select(group).call(drag)
    }
  })
</script>

<g class="cursor-pointer" role="presentation" bind:this={group} oncontextmenu={onContextMenu}>
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
