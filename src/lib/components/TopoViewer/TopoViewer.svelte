<script context="module" lang="ts">
  export interface Coordinates {
    x: number
    y: number
  }

  export interface Point extends Coordinates {
    id: number
    type: 'start' | 'middle' | 'top'
  }

  export interface Line {
    from: Coordinates
    to: Coordinates
  }

  export type TopType = 'top' | 'topout'
</script>

<script lang="ts">
  import type { EventHandler, MouseEventHandler } from 'svelte/elements'
  import type { FileStat } from 'webdav'

  export let file: FileStat
  export let value: Point[] = []
  export let topType: TopType = 'topout'

  let height = 0
  let width = 0
  let currentType: Point['type'] | undefined = undefined
  let lines: Array<Line> = []
  let selectedPoint: Point | undefined = undefined

  const onChangeType = (type: Point['type']) => () => {
    currentType = currentType === type ? undefined : type
  }

  const onClickSvg: MouseEventHandler<SVGElement> = (event) => {
    selectedPoint = undefined

    if (currentType == null) {
      selectedPoint = value.find((point) => String(point.id) === (event.target as HTMLElement).id)
      return
    }

    value = [...value, { id: Date.now(), type: currentType, x: event.layerX, y: event.layerY }]
    calcLines()

    currentType = undefined
  }

  const onMouseMoveSvg: MouseEventHandler<SVGElement> = (event) => {
    if (event.buttons === 0) {
      return
    }

    const point = selectedPoint ?? value.find((point) => String(point.id) === (event.target as HTMLElement).id)

    if (point != null) {
      if (selectedPoint == null) {
        selectedPoint = point
      }

      point.x = event.layerX
      point.y = event.layerY

      value = value

      calcLines()
    }
  }

  const onLoad: EventHandler = (event) => {
    const target = event.currentTarget as HTMLImageElement
    height = target.height
    width = target.width
  }

  const onClickDelete: EventHandler = () => {
    value = value.filter((point) => point.id !== selectedPoint?.id)
    selectedPoint = undefined
    calcLines()
  }

  const calcLines = () => {
    const startPoints = value.filter((point) => point.type === 'start')
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

    const nonStartPoints = value
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
</script>

<div class="flex justify-between p-2 bg-surface-500">
  <label class="flex items-center space-x-2">
    <input
      checked={topType === 'topout'}
      class="checkbox"
      on:change={(event) => (topType = event.currentTarget.checked ? 'topout' : 'top')}
      type="checkbox"
    />

    <p>Topout</p>
  </label>

  <div class="flex gap-1">
    <button
      class={`btn btn-sm ${currentType === 'start' ? 'variant-filled-success' : 'variant-filled-tertiary'}`}
      disabled={value.filter((point) => point.type === 'start').length >= 2}
      on:click={onChangeType('start')}
    >
      Start
    </button>

    <button
      class={`btn btn-sm ${currentType === 'middle' ? 'variant-filled-success' : 'variant-filled-tertiary'}`}
      on:click={onChangeType('middle')}
    >
      Middle
    </button>

    <button
      class={`btn btn-sm ${currentType === 'top' ? 'variant-filled-success' : 'variant-filled-tertiary'}`}
      disabled={value.filter((point) => point.type === 'top').length >= 1}
      on:click={onChangeType('top')}
    >
      Top
    </button>
  </div>

  <div>
    <button class="btn btn-sm variant-filled-tertiary" disabled={selectedPoint == null} on:click={onClickDelete}>
      <i class="fa-solid fa-trash" />
    </button>
  </div>
</div>

<div class="relative">
  <img alt={file.filename} src={`/nextcloud${file.filename}`} on:load={onLoad} />

  <div class="absolute top-0 left-0" style={`height: ${height}px; width: ${width}px`}>
    <svg
      {height}
      {width}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      on:click={onClickSvg}
      on:mousemove={onMouseMoveSvg}
    >
      {#each lines as line}
        <line class="stroke-red-700" stroke-width={2} x1={line.from.x} x2={line.to.x} y1={line.from.y} y2={line.to.y} />
      {/each}

      {#each value as point}
        {#if point.type === 'start'}
          <circle
            class={`${point.id === selectedPoint?.id ? 'cursor-move stroke-green-400' : 'cursor-pointer stroke-red-700'}`}
            cx={point.x}
            cy={point.y}
            fill="transparent"
            id={String(point.id)}
            r={10}
            role="presentation"
            stroke-width={2}
          />
        {:else if point.type === 'middle'}
          <circle
            class={`${point.id === selectedPoint?.id ? 'cursor-move fill-green-400' : 'cursor-pointer fill-red-700'}`}
            cx={point.x}
            cy={point.y}
            id={String(point.id)}
            r={5}
          />
        {:else if point.type === 'top'}
          {#if topType === 'topout'}
            <polyline
              class={`${point.id === selectedPoint?.id ? 'cursor-move stroke-green-400' : 'cursor-pointer stroke-red-700'}`}
              fill="transparent"
              id={String(point.id)}
              stroke-width={4}
              points={`${point.x - 20},${point.y + 20} ${point.x},${point.y}, ${point.x + 20},${point.y + 20}`}
            />
          {:else}
            <line
              class={`${point.id === selectedPoint?.id ? 'cursor-move stroke-green-400' : 'cursor-pointer stroke-red-700'}`}
              fill="transparent"
              id={String(point.id)}
              stroke-width={4}
              x1={point.x - 20}
              x2={point.x + 20}
              y1={point.y}
              y2={point.y}
            />
          {/if}
        {/if}
      {/each}
    </svg>
  </div>
</div>
