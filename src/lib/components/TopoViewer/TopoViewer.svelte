<script lang="ts">
  import type { PointDTO, RouteDTO, TopoDTO } from '$lib/topo'
  import { createEventDispatcher } from 'svelte'
  import type { ChangeEventHandler, MouseEventHandler } from 'svelte/elements'
  import RouteView from './components/Route'
  import { selectedRouteStore } from './stores'

  export let topos: TopoDTO[]
  export let editable = false
  export let showRouteKey = false
  export let selectedTopoIndex = 0

  let img: HTMLImageElement
  let imgWrapper: HTMLDivElement
  let height = 0
  let width = 0
  let scale = 0
  let translateX = 0
  let translateY = 0
  let currentType: PointDTO['type'] | undefined = undefined
  let selectedPoint: PointDTO | undefined = undefined
  let svg: SVGSVGElement | undefined

  $: selectedTopo = topos.at(selectedTopoIndex)
  $: selectedTopoRoute = topos.flatMap((topo) => topo.routes).find((route) => route.routeFk === $selectedRouteStore)

  const dispatcher = createEventDispatcher<{ change: RouteDTO }>()

  selectedRouteStore.subscribe(() => {
    currentType = undefined
    selectedPoint = undefined

    const index = topos.findIndex((topo) => topo.routes.some((route) => route.routeFk === $selectedRouteStore))
    selectedTopoIndex = index < 0 ? selectedTopoIndex : index
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

<div bind:this={imgWrapper} class="relative overflow-hidden h-full w-full flex items-center justify-center">
  <ul class="absolute left-0 top-0 z-50">
    <li>{translateY}</li>
    <li>{img?.getBoundingClientRect().y}</li>
    <li>{imgWrapper?.getBoundingClientRect().y}</li>
    <li>{(img?.getBoundingClientRect().y ?? 0) - (imgWrapper?.getBoundingClientRect().y ?? 0)}</li>
    <li>{(imgWrapper?.getBoundingClientRect().y ?? 0) / (img?.getBoundingClientRect().y ?? 0)}</li>
    <li>{((imgWrapper?.getBoundingClientRect().height ?? 0) - (img?.getBoundingClientRect().height ?? 0)) / 2}</li>
    <li>style={`left: ${translateX}px; right: ${translateX}px; top: ${translateY}px; bottom: ${translateY}px`}</li>
  </ul>

  {#each topos as topo, index}
    {#if index === selectedTopoIndex}
      <img
        alt={topo.file.stat?.filename}
        class="absolute top-0 left-0 w-full object-cover blur"
        bind:this={img}
        on:load={getDimensions}
        src={`/nextcloud${topo.file.stat?.filename}`}
      />

      <img
        alt={topo.file.stat?.filename}
        class="m-auto relative z-10"
        bind:this={img}
        on:load={getDimensions}
        src={`/nextcloud${topo.file.stat?.filename}`}
      />
    {/if}
  {/each}

  <div
    class="absolute z-20 border border-red-500"
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
          <RouteView {route} {scale} {svg} key={showRouteKey ? index + 1 : undefined} on:change={onChangeRoute} />
        {/each}
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
</style>
