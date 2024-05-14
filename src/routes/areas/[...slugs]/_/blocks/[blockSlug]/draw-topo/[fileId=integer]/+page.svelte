<script lang="ts">
  import { page } from '$app/stores'
  import TopoViewer, { type Point, type TopType } from '$lib/components/TopoViewer'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let form
  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`

  let value: Point[] = []
  let topType: TopType = 'topout'
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Draw topo of</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.block.name}</a>
  </svelte:fragment>
</AppBar>

{#if form?.error != null}
  <aside class="alert variant-filled-error mt-8">
    <div class="alert-message">
      <p>{form.error}</p>
    </div>
  </aside>
{/if}

<div class="mt-8">
  <TopoViewer file={data.file.stat} bind:value bind:topType />
</div>

<form method="POST">
  <input hidden name="topType" value={topType} />
  <input hidden name="count" value={value.length} />

  {#each value as point}
    <input hidden name="points.x" value={point.x} />
    <input hidden name="points.y" value={point.y} />
    <input hidden name="points.type" value={point.type} />
  {/each}

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button
      class="btn variant-filled-primary"
      disabled={!(value.some((point) => point.type === 'start') && value.some((point) => point.type === 'top'))}
    >
      Save topo
    </button>
  </div>
</form>
