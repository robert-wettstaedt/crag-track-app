<script lang="ts">
  import type { PointDTO, TopoDTO, TopoRouteDTO } from '$lib/topo'
  import { createEventDispatcher } from 'svelte'
  import type { ChangeEventHandler, MouseEventHandler } from 'svelte/elements'
  import RouteView from './components/Route'
  import { selectedPointTypeStore, selectedRouteStore } from './stores'

  interface Props {
    topos: TopoDTO[]
    editable?: boolean
    selectedTopoIndex?: number
    getRouteKey?: ((route: TopoRouteDTO, index: number) => number) | null
  }

  let { topos = $bindable(), editable = false, selectedTopoIndex = $bindable(0), getRouteKey = null }: Props = $props()

  let img: HTMLImageElement | undefined = $state()
  let imgWrapper: HTMLDivElement | undefined = $state()

  let height = $state(0)
  let width = $state(0)
  let scale = $state(0)
  let translateX = $state(0)
  let translateY = $state(0)
  let selectedPoint: PointDTO | undefined = undefined
  let svg: SVGSVGElement | undefined = $state()

  let selectedTopo = $derived(topos.at(selectedTopoIndex))
  let selectedTopoRoute = $derived(
    topos.flatMap((topo) => topo.routes).find((route) => route.routeFk === $selectedRouteStore),
  )

  const dispatcher = createEventDispatcher<{ change: TopoRouteDTO; load: void }>()

  selectedRouteStore.subscribe(() => {
    $selectedPointTypeStore = null
    selectedPoint = undefined

    const index = topos.findIndex((topo) => topo.routes.some((route) => route.routeFk === $selectedRouteStore))
    selectedTopoIndex = index < 0 ? selectedTopoIndex : index
  })

  const onClickSvg: MouseEventHandler<SVGElement> = (event) => {
    if ($selectedRouteStore != null && $selectedPointTypeStore != null) {
      if (selectedTopoRoute == null) {
        return
      }

      const point: PointDTO = {
        id: crypto.randomUUID(),
        type: $selectedPointTypeStore,
        x: Math.ceil(event.layerX / scale),
        y: Math.ceil(event.layerY / scale),
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
      dispatcher('change', selectedTopoRoute)
    }
  }

  const onChangeTopType: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (selectedTopoRoute != null) {
      selectedTopoRoute.topType = event.currentTarget.checked ? 'topout' : 'top'
      topos = topos
      dispatcher('change', selectedTopoRoute)
    }
  }

  const onChangeType = (type: PointDTO['type']) => () => {
    $selectedPointTypeStore = $selectedPointTypeStore === type ? null : type
  }

  const onChangeRoute = (event: CustomEvent<TopoRouteDTO>) => {
    topos = topos
    dispatcher('change', event.detail)
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

  const onLoadImage = () => {
    getDimensions()
    dispatcher('load')
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
          class="m-auto relative z-10 pointer-events-none touch-none"
          id="img"
          onload={onLoadImage}
          src={`/nextcloud${topo.file.stat?.filename}`}
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
    <svg
      bind:this={svg}
      onclick={onClickSvg}
      role="presentation"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {#if svg != null && selectedTopo != null}
        {#each selectedTopo.routes as route, index}
          {#if $selectedRouteStore !== route.routeFk}
            <RouteView {editable} {route} {scale} {svg} key={getRouteKey?.(route, index)} on:change={onChangeRoute} />
          {/if}
        {/each}

        {#if selectedTopoRoute != null}
          <RouteView
            {editable}
            {scale}
            {svg}
            key={getRouteKey?.(
              selectedTopoRoute,
              selectedTopo.routes.findIndex((route) => route.routeFk === $selectedRouteStore),
            )}
            route={selectedTopoRoute}
            on:change={onChangeRoute}
          />
        {/if}
      {/if}
    </svg>
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
  }
</style>
