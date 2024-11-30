<script lang="ts">
  import type { PointDTO, TopoDTO, TopoRouteDTO } from '$lib/topo'
  import * as d3 from 'd3'
  import type { ChangeEventHandler, MouseEventHandler } from 'svelte/elements'
  import RouteView from './components/Route'
  import { highlightedRouteStore, selectedPointTypeStore, selectedRouteStore } from './stores'
  import Labels from './components/Labels'

  interface Props {
    editable?: boolean
    getRouteKey?: ((route: TopoRouteDTO, index: number) => number) | null
    onChange?: (value: TopoDTO[], changedRoute: TopoRouteDTO) => void
    onLoad?: () => void
    selectedTopoIndex?: number
    topos: TopoDTO[]
  }

  let {
    topos = $bindable(),
    editable = false,
    getRouteKey = null,
    onChange,
    onLoad,
    selectedTopoIndex = $bindable(0),
  }: Props = $props()

  let img: HTMLImageElement | undefined = $state()
  let imgWrapper: HTMLDivElement | undefined = $state()

  let height = $state(0)
  let width = $state(0)
  let scale = $state(0)
  let translateX = $state(0)
  let translateY = $state(0)
  let selectedPoint: PointDTO | undefined = undefined
  let svg: SVGSVGElement | undefined = $state()
  let clicked = false

  let zoomTransform: d3.ZoomTransform | undefined = $state()

  let selectedTopo = $derived.by(() => {
    const topo = topos.at(selectedTopoIndex)
    if (topo != null) {
      const routes = topo.routes.toSorted((a, b) => {
        const prioA = $highlightedRouteStore === a.routeFk ? 2 : $selectedRouteStore === a.routeFk ? 1 : 0
        const prioB = $highlightedRouteStore === b.routeFk ? 2 : $selectedRouteStore === b.routeFk ? 1 : 0

        return prioA - prioB
      })

      return { ...topo, routes }
    }

    return topo
  })

  let selectedTopoRoute = $derived(
    topos.flatMap((topo) => topo.routes).find((route) => route.routeFk === $selectedRouteStore),
  )

  selectedRouteStore.subscribe(() => {
    $selectedPointTypeStore = null
    selectedPoint = undefined

    const index = topos.findIndex((topo) => topo.routes.some((route) => route.routeFk === $selectedRouteStore))
    selectedTopoIndex = index < 0 ? selectedTopoIndex : index
  })

  const onClickSvg: MouseEventHandler<SVGElement> = (event) => {
    if (!editable && !clicked) {
      clicked = true
      initZoom()
    }

    if ($selectedRouteStore != null && $selectedPointTypeStore != null) {
      if (selectedTopoRoute == null) {
        return
      }

      const point: PointDTO = {
        id: crypto.randomUUID(),
        type: $selectedPointTypeStore,
        x: Math.ceil((event.layerX - (zoomTransform?.x ?? 0)) / scale / (zoomTransform?.k ?? 1)),
        y: Math.ceil((event.layerY - (zoomTransform?.y ?? 0)) / scale / (zoomTransform?.k ?? 1)),
      }

      const closePoint = topos
        .flatMap((topo) => topo.routes.flatMap((route) => route.points))
        .find((p) => Math.abs(p.x - point.x) < 10 && Math.abs(p.y - point.y) < 10)

      if (closePoint != null) {
        point.x = closePoint.x
        point.y = closePoint.y
      }

      selectedTopoRoute.points = [...selectedTopoRoute.points, point]
      $selectedPointTypeStore = null
      onChange?.(topos, selectedTopoRoute)
    }

    if ($selectedRouteStore != null && $selectedPointTypeStore == null && (event.target as Element).tagName === 'svg') {
      selectedRouteStore.set(null)
    }
  }

  const onMouseMoveSvg: MouseEventHandler<SVGElement> = (event) => {
    const routeIdStr = (event.target as HTMLElement).attributes.getNamedItem('data-route-id')?.value
    const routeId = Number(routeIdStr)

    if ($selectedRouteStore !== routeId) {
      highlightedRouteStore.set(Number.isNaN(routeId) ? null : routeId)
    }
  }

  const onChangeTopType: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (selectedTopoRoute != null) {
      selectedTopoRoute.topType = event.currentTarget.checked ? 'topout' : 'top'
      onChange?.(topos, selectedTopoRoute)
    }
  }

  const onChangeType = (type: PointDTO['type']) => () => {
    $selectedPointTypeStore = $selectedPointTypeStore === type ? null : type
  }

  const onChangeRoute = (index: number) => (value: TopoRouteDTO) => {
    if (selectedTopo != null) {
      selectedTopo.routes[index] = value
    }

    onChange?.(topos, value)
  }

  const onPrevTopo = () => {
    selectedTopoIndex = Math.max(selectedTopoIndex - 1, 0)
    selectedRouteStore.set(null)
  }

  const onNextTopo = () => {
    selectedTopoIndex = Math.min(selectedTopoIndex + 1, topos.length - 1)
    selectedRouteStore.set(null)
  }

  const getDimensions = () => {
    if (img == null || imgWrapper == null) {
      return
    }

    scale = img.width / img.naturalWidth
    height = img.height
    width = img.width
    translateX = img.getBoundingClientRect().x - imgWrapper.getBoundingClientRect().x
    translateY = img.getBoundingClientRect().y - imgWrapper.getBoundingClientRect().y
  }

  const initZoom = () => {
    if (svg == null) {
      return
    }

    const zoom = d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .translateExtent([
        [-width / 2, -height / 2],
        [width * 1.5, height * 1.5],
      ])
      .scaleExtent([0.5, 9])
      .on('zoom', (event: { transform: d3.ZoomTransform }) => {
        zoomTransform = event.transform
      })

    d3.select(svg).call(zoom)
  }

  const onLoadImage = () => {
    getDimensions()
    onLoad?.()

    if (editable) {
      initZoom()
    }
  }
</script>

<svelte:window onresize={getDimensions} />

{#if editable}
  <div class="flex justify-between p-2 preset-filled-surface-100-900">
    {#if $selectedRouteStore == null}
      <p>Select a route to edit</p>
    {:else}
      <label class="flex items-center space-x-2">
        <input
          checked={selectedTopoRoute?.topType === 'topout'}
          class="checkbox"
          onchange={onChangeTopType}
          type="checkbox"
        />

        <p>Topout</p>
      </label>

      <div class="flex gap-1">
        <button
          class={`btn btn-sm ${$selectedPointTypeStore === 'start' ? 'preset-filled-success-500' : 'preset-filled-secondary-500'}`}
          disabled={(selectedTopoRoute?.points ?? []).filter((point) => point.type === 'start').length >= 2}
          onclick={onChangeType('start')}
        >
          Start
        </button>

        <button
          class={`btn btn-sm ${$selectedPointTypeStore === 'middle' ? 'preset-filled-success-500' : 'preset-filled-secondary-500'}`}
          onclick={onChangeType('middle')}
        >
          Middle
        </button>

        <button
          class={`btn btn-sm ${$selectedPointTypeStore === 'top' ? 'preset-filled-success-500' : 'preset-filled-secondary-500'}`}
          disabled={(selectedTopoRoute?.points ?? []).filter((point) => point.type === 'top').length >= 1}
          onclick={onChangeType('top')}
        >
          Top
        </button>
      </div>
    {/if}
  </div>
{/if}

<div bind:this={imgWrapper} class="relative overflow-hidden h-full w-full flex items-center justify-center">
  {#each topos as topo, index}
    {#if index === selectedTopoIndex}
      {#if topo.file.error == null}
        <img
          alt={topo.file.stat?.filename}
          bind:this={img}
          class="absolute top-0 left-0 w-full h-full object-cover blur pointer-events-none touch-none"
          onload={getDimensions}
          src={`/nextcloud${topo.file.stat?.filename}`}
        />

        <img
          alt={topo.file.stat?.filename}
          bind:this={img}
          class="m-auto relative z-10 pointer-events-none touch-none origin-top-left"
          id="img"
          onload={onLoadImage}
          src={`/nextcloud${topo.file.stat?.filename}`}
          style={zoomTransform == null
            ? undefined
            : `transform: translate(${zoomTransform.x}px, ${zoomTransform.y}px) scale(${zoomTransform.k})`}
        />
      {:else}
        <p>Error loading image</p>
      {/if}
    {/if}
  {/each}

  <div
    class="absolute z-20"
    style={`left: ${translateX}px; right: ${translateX}px; top: ${translateY}px; bottom: ${translateY}px`}
  >
    {#if selectedTopo != null}
      <svg
        bind:this={svg}
        onclick={onClickSvg}
        onmousemove={onMouseMoveSvg}
        role="presentation"
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={zoomTransform?.toString()}>
          {#each selectedTopo.routes as _, index}
            <RouteView
              {editable}
              {height}
              {scale}
              {width}
              bind:route={selectedTopo.routes[index]}
              onChange={onChangeRoute(index)}
            />
          {/each}
        </g>
      </svg>

      <Labels {getRouteKey} {scale} routes={selectedTopo?.routes} />
    {/if}
  </div>

  {#if topos.length > 1}
    <div class="flex gap-1 absolute top-2 right-2 z-30">
      <button
        aria-label="Previous Topo"
        class="btn btn-sm preset-outlined-primary-500-primary"
        disabled={selectedTopoIndex <= 0}
        onclick={onPrevTopo}
      >
        <i class="fa-solid fa-caret-left"></i>
      </button>

      <button
        aria-label="Next Topo"
        class="btn btn-sm preset-outlined-primary-500-primary"
        disabled={selectedTopoIndex >= topos.length - 1}
        onclick={onNextTopo}
      >
        <i class="fa-solid fa-caret-right"></i>
      </button>
    </div>
  {/if}
</div>

<style>
  #img {
    max-height: 70vh;
  }

  @media print {
    #img {
      max-height: none;
    }

    img {
      print-color-adjust: exact !important;
    }
  }
</style>
