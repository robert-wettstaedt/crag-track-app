<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { AppBar, popup, Tab, TabGroup } from '@skeletonlabs/skeleton'
  import type { Coordinate } from 'ol/coordinate'
  import type { ChangeEventHandler } from 'svelte/elements'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`

  let coordinate: Coordinate | null = null
  let tabSet = 0

  const onChange = ({ detail }: CustomEvent<Coordinate>) => (coordinate = detail)

  const getValue: ChangeEventHandler<HTMLInputElement> = (event): number => {
    return Number((event.target as HTMLInputElement).value)
  }

  const onChangeLat: ChangeEventHandler<HTMLInputElement> = (event) => {
    coordinate = [coordinate?.at(0), getValue(event)]
  }

  const onChangeLong: ChangeEventHandler<HTMLInputElement> = (event) => {
    coordinate = [getValue(event), coordinate?.at(1)]
  }
</script>

<svelte:head>
  <title>Edit parking location of {data.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit parking location of</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.name}</a>
  </svelte:fragment>
</AppBar>

<form action="?/updateParkingLocation" method="POST" use:enhance>
  {#if form?.error != null}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <TabGroup>
      <Tab bind:group={tabSet} name="tab1" value={0}>
        <span>Map</span>
      </Tab>
      <Tab bind:group={tabSet} name="tab2" value={1}>
        <span>Lat Long</span>
      </Tab>

      <svelte:fragment slot="panel">
        {#if tabSet === 0}
          {#await import('$lib/components/BlocksMapWithAddableMarker') then BlocksMap}
            <BlocksMap.default blocks={data.blocks} on:change={onChange} />
          {/await}

          <input hidden name="lat" value={form?.lat ?? coordinate?.at(1)} />
          <input hidden name="long" value={form?.long ?? coordinate?.at(0)} />
        {:else if tabSet === 1}
          <div class="flex flex-col gap-4">
            <label class="label">
              <span>Latitude</span>
              <input class="input" name="lat" on:change={onChangeLat} value={form?.lat ?? coordinate?.at(1) ?? ''} />
            </label>

            <label class="label">
              <span>Longitude</span>
              <input class="input" name="long" on:change={onChangeLong} value={form?.long ?? coordinate?.at(0) ?? ''} />
            </label>
          </div>
        {/if}
      </svelte:fragment>
    </TabGroup>
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>

    <div>
      <button
        class="btn variant-filled-error"
        use:popup={{ event: 'click', target: 'popup-delete-parking-location', placement: 'top' }}
        type="button"
      >
        <i class="fa-solid fa-trash me-2" />Delete parking location
      </button>

      <button class="btn variant-filled-primary" disabled={coordinate == null} type="submit">
        Update parking location
      </button>
    </div>
  </div>
</form>

<div class="card p-4 shadow-xl" data-popup="popup-delete-parking-location">
  <p>Are you sure you want to delete this parking location?</p>

  <div class="flex justify-end gap-2 mt-4">
    <form method="POST" action="?/removeParkingLocation" use:enhance>
      <button class="btn btn-sm variant-filled-primary" type="submit">Yes</button>
    </form>

    <button class="btn btn-sm variant-filled-surface">Cancel</button>
  </div>
</div>
