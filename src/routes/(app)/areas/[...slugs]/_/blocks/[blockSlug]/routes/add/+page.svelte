<script lang="ts">
  import { page } from '$app/stores'
  import RouteFormFields from '$lib/components/RouteFormFields'
  import { AppBar } from '@skeletonlabs/skeleton'

  export let form
  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`
</script>

<svelte:head>
  <title>Create route in {data.block.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Create route in</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.block.name}</a>
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
    <RouteFormFields
      description={form?.description ?? ''}
      grade={form?.grade ?? null}
      gradingScale={form?.gradingScale}
      name={form?.name ?? ''}
      rating={form?.rating ?? null}
      routeTags={form?.tags ?? []}
      tags={data.tags}
    />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary">Save route</button>
  </div>
</form>
