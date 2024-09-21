<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import RouteFormFields from '$lib/components/RouteFormFields'
  import { AppBar, ProgressRadial } from '@skeletonlabs/skeleton'

  export let form
  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`

  let loading = false
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

<form
  method="POST"
  use:enhance={() => {
    loading = true

    return () => {
      loading = false
    }
  }}
>
  {#if form?.error != null}
    <aside class="alert variant-filled-error mt-8">
      <div class="alert-message">
        <p>{form.error}</p>
      </div>
    </aside>
  {/if}

  <div class="mt-8">
    <RouteFormFields
      blockId={data.block.id}
      description={form?.description ?? ''}
      gradeFk={form?.gradeFk ?? null}
      grades={data.grades}
      gradingScale={data.user?.userSettings?.gradingScale}
      name={form?.name ?? ''}
      rating={form?.rating ?? null}
      routeTags={form?.tags ?? []}
      tags={data.tags}
    />
  </div>

  <div class="flex justify-between mt-8">
    <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>
    <button class="btn variant-filled-primary" type="submit" disabled={loading}>
      {#if loading}
        <ProgressRadial class="me-2" width="w-4" />
      {/if}
      Save route
    </button>
  </div>
</form>
