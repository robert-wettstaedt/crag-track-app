<script lang="ts">
  import { applyAction, enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import RouteFormFields from '$lib/components/RouteFormFields'
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte'

  let { form, data } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`)

  let loading = $state(false)
</script>

<svelte:head>
  <title>Create route in {data.block.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    <span>Create route in</span>
    <a class="anchor" href={basePath}>{data.block.name}</a>
  {/snippet}
</AppBar>

{#if form?.error}
  <aside class="card preset-tonal-warning mt-8 p-2 md:p-4">
    <p>{form.error}</p>
  </aside>
{/if}

<form
  class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900"
  method="POST"
  use:enhance={() => {
    loading = true

    return ({ action, result }) => {
      loading = false

      if (
        location.origin + location.pathname === action.origin + action.pathname ||
        result.type === 'redirect' ||
        result.type === 'error'
      ) {
        applyAction(result)
      }
    }
  }}
>
  <RouteFormFields
    blockId={data.block.id}
    description={form?.description ?? ''}
    gradeFk={form?.gradeFk ?? null}
    grades={data.grades}
    gradingScale={data.user?.userSettings?.gradingScale}
    name={form?.name ?? ''}
    rating={form?.rating ?? undefined}
    routeTags={form?.tags ?? []}
    tags={data.tags}
  />

  <div class="flex justify-between mt-8">
    <button class="btn preset-outlined-primary-500" onclick={() => history.back()} type="button">Cancel</button>
    <button class="btn preset-filled-primary-500" type="submit" disabled={loading}>
      {#if loading}
        <span class="me-2">
          <ProgressRing size="size-4" value={null} />
        </span>
      {/if}
      Save route
    </button>
  </div>
</form>
