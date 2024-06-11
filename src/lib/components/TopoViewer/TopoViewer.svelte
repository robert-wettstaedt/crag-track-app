<script lang="ts">
  import type { TopoRoute } from '$lib/db/schema'
  import type { FileDTO } from '$lib/nextcloud'
  import type { PointDTO, RouteDTO, TopoDTO } from '$lib/topo'
  import type { ChangeEventHandler, EventHandler, MouseEventHandler } from 'svelte/elements'
  import RouteView from './components/Route'
  import { selectedRouteStore } from './stores'
  import { createEventDispatcher } from 'svelte'

  export let file: FileDTO
  export let topos: TopoDTO[]
  export let editable = false

  let img: HTMLImageElement
  let height = 0
  let width = 0
  let scale = 0
  let currentType: PointDTO['type'] | undefined = undefined
  let selectedPoint: PointDTO | undefined = undefined
  let svg: SVGSVGElement | undefined

  $: selectedTopoRoute = topos.flatMap((topo) => topo.routes).find((route) => route.routeFk === $selectedRouteStore)

  const dispatcher = createEventDispatcher<{ change: RouteDTO }>()

  selectedRouteStore.subscribe(() => {
    currentType = undefined
    selectedPoint = undefined
  })

  const onClickSvg: MouseEventHandler<SVGElement> = (event) => {
    if ($selectedRouteStore != null && currentType != null) {
      if (selectedTopoRoute == null) {
        return
      }

      const point: PointDTO = {
        id: crypto.randomUUID(),
        type: currentType,
        x: Math.ceil(event.layerX / scale),
        y: Math.ceil(event.layerY / scale),
      }

      selectedTopoRoute.points = [...selectedTopoRoute.points, point]
      currentType = undefined
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
    currentType = currentType === type ? undefined : type
  }

  const onChangeRoute = (event: CustomEvent<RouteDTO>) => {
    topos = topos
    dispatcher('change', event.detail)
  }

  const getDimensions = () => {
    scale = img.width / img.naturalWidth
    height = img.height
    width = img.width
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
          class={`btn btn-sm ${currentType === 'start' ? 'variant-filled-success' : 'variant-filled-tertiary'}`}
          disabled={(selectedTopoRoute?.points ?? []).filter((point) => point.type === 'start').length >= 2}
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
          disabled={(selectedTopoRoute?.points ?? []).filter((point) => point.type === 'top').length >= 1}
          on:click={onChangeType('top')}
        >
          Top
        </button>
      </div>
    {/if}
  </div>
{/if}

<div class="relative overflow-hidden">
  <img
    alt={file.stat?.filename}
    class="absolute top-0 left-0 w-full object-cover blur"
    bind:this={img}
    on:load={getDimensions}
    src={`/nextcloud${file.stat?.filename}`}
  />

  <img
    alt={file.stat?.filename}
    class="m-auto relative z-10"
    bind:this={img}
    on:load={getDimensions}
    src={`/nextcloud${file.stat?.filename}`}
  />

  <div class="absolute top-0 left-2/4 -translate-x-2/4 z-20" style={`height: ${height}px; width: ${width}px`}>
    <svg
      {height}
      {width}
      bind:this={svg}
      on:click={onClickSvg}
      role="presentation"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {#if svg != null}
        {#each topos as topo}
          {#each topo.routes as route}
            <RouteView {route} {scale} {svg} on:change={onChangeRoute} />
          {/each}
        {/each}
      {/if}
    </svg>
  </div>
</div>

<style>
  img {
    max-height: 70vh;
  }
</style>
