<script lang="ts">
  import type { PointDTO, TopoDTO, TopoRouteDTO } from '$lib/topo'
  import { createEventDispatcher } from 'svelte'
  import type { ChangeEventHandler, MouseEventHandler } from 'svelte/elements'
  import RouteView from './components/Route'
  import { selectedPointTypeStore, selectedRouteStore } from './stores'

  export let topos: TopoDTO[]
  export let editable = false
  export let selectedTopoIndex = 0
  export let getRouteKey: ((route: TopoRouteDTO, index: number) => string | number) | null = null

  let img: HTMLImageElement
  let imgWrapper: HTMLDivElement
  let height = 0
  let width = 0
  let scale = 0
  let translateX = 0
  let translateY = 0
  let selectedPoint: PointDTO | undefined = undefined
  let svg: SVGSVGElement | undefined

  $: selectedTopo = topos.at(selectedTopoIndex)
  $: selectedTopoRoute = topos.flatMap((topo) => topo.routes).find((route) => route.routeFk === $selectedRouteStore)

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

<svelte:window on:resize={getDimensions} />

{#if editable}
  <div class="flex justify-between p-2 bg-surface-500">
    {#if $selectedRouteStore == null}
      <p class="p-1">Select a route to edit</p>
    {:else}
      <label class="flex items-center space-x-2">
        <input
          checked={selectedTopoRoute?.topType === 'topout'}
          class="checkbox"
          on:change={onChangeTopType}
          type="checkbox"
        />

        <p>Topout</p>
      </label>

      <div class="flex gap-1">
        <button
          class={`btn btn-sm ${$selectedPointTypeStore === 'start' ? 'variant-filled-success' : 'variant-filled-tertiary'}`}
          disabled={(selectedTopoRoute?.points ?? []).filter((point) => point.type === 'start').length >= 2}
          on:click={onChangeType('start')}
        >
          Start
        </button>

        <button
          class={`btn btn-sm ${$selectedPointTypeStore === 'middle' ? 'variant-filled-success' : 'variant-filled-tertiary'}`}
          on:click={onChangeType('middle')}
        >
          Middle
        </button>

        <button
          class={`btn btn-sm ${$selectedPointTypeStore === 'top' ? 'variant-filled-success' : 'variant-filled-tertiary'}`}
          disabled={(selectedTopoRoute?.points ?? []).filter((point) => point.type === 'top').length >= 1}
          on:click={onChangeType('top')}
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
          on:load={getDimensions}
          src={`/nextcloud${topo.file.stat?.filename}`}
        />

        <img
          alt={topo.file.stat?.filename}
          bind:this={img}
          class="m-auto relative z-10 pointer-events-none touch-none"
          id="img"
          on:load={onLoadImage}
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
      on:click={onClickSvg}
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
      <button class="btn btn-sm variant-ghost-primary" disabled={selectedTopoIndex <= 0} on:click={onPrevTopo}>
        <i class="fa-solid fa-caret-left" />
      </button>

      <button
        class="btn btn-sm variant-ghost-primary"
        disabled={selectedTopoIndex >= topos.length - 1}
        on:click={onNextTopo}
      >
        <i class="fa-solid fa-caret-right" />
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
