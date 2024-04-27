<script lang="ts">
  import { page } from '$app/stores'
  import { AppBar } from '@skeletonlabs/skeleton'
  import type { Coordinate } from 'ol/coordinate'

  export let data
  export let form
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}`

  let coordinate: Coordinate | null = null

  const onChange = ({ detail }: CustomEvent<Coordinate>) => (coordinate = detail)
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Edit geolocation of</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.crag.name}</a>
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
    {#await import('$lib/components/CragMapWithAddableMarker/index.js') then CragMap}
      <CragMap.default crags={data.crags} on:change={onChange} />
    {/await}

    <input hidden name="lat" value={form?.lat ?? coordinate?.at(1)} />
    <input hidden name="long" value={form?.long ?? coordinate?.at(0)} />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary" disabled={coordinate == null}>Update geolocation</button>
  </div>
</form>
