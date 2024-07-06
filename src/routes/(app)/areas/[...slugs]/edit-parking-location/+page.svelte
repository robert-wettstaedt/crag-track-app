<script lang="ts">
  import { page } from '$app/stores'
  import { AppBar, Tab, TabGroup } from '@skeletonlabs/skeleton'
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

<form method="POST">
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
          {#await import('$lib/components/BlocksMapWithAddableMarker/index.js') then BlocksMap}
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
    <button class="btn variant-filled-primary" disabled={coordinate == null}>Update parking location</button>
  </div>
</form>
