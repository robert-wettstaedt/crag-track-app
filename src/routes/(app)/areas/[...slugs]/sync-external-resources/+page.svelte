<script lang="ts">
  import { page } from '$app/stores'
  import { convertException } from '$lib'
  import RouteExternalResourceLinks from '$lib/components/RouteExternalResourceLinks'
  import RouteName from '$lib/components/RouteName'
  import type { InferResultType } from '$lib/db/types.js'
  import { AppBar, ProgressRadial } from '@skeletonlabs/skeleton'

  export let data
  $: basePath = `/areas/${$page.params.slugs}`

  let error: string | null = null
  let loading = false
  let values:
    | InferResultType<
        'routeExternalResources',
        { externalResource8a: true; externalResource27crags: true; externalResourceTheCrag: true }
      >[]
    | undefined = undefined

  async function syncExternalResources() {
    try {
      values = undefined
      error = null
      loading = true
      const response = await fetch('sync-external-resources', { method: 'POST' })

      if (response.status >= 300) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()

      while (reader != null) {
        const { done, value } = await reader.read()
        if (done) break

        try {
          const decoded = new TextDecoder().decode(value).split('\n')

          values = [
            ...(values ?? []),
            ...decoded.filter((value) => value.trim().length > 0).map((value) => JSON.parse(value)),
          ]
        } catch (exception) {
          console.error(exception)
        }
      }
    } catch (exception) {
      error = convertException(exception)
    }

    loading = false
  }
</script>

<svelte:head>
  <title>Sync external resources of {data.area.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    <span>Sync external resources of</span>
    &nbsp;
    <a class="anchor" href={basePath}>{data.area.name}</a>
  </svelte:fragment>
</AppBar>

{#if error != null}
  <aside class="alert variant-filled-error mt-8">
    <div class="alert-message">
      <p>{error}</p>
    </div>
  </aside>
{/if}

<div class="mt-8 w-full text-token card p-4 space-y-4">
  {#each data.blocks as block}
    <p class="font-bold">{block.name}</p>

    <ul class="list">
      {#each block.routes as route}
        <li class="flex items-center justify-between p-1 hover:bg-surface-400">
          <RouteName {route} />

          {#if loading && values?.find((value) => value.routeFk === route.id) == null}
            <ProgressRadial class="w-4" />
          {:else}
            <RouteExternalResourceLinks
              iconSize={16}
              routeExternalResources={values?.find((value) => value.routeFk === route.id) ??
                data.externalResources.find((externalResource) => externalResource.routeFk === route.id)}
              showNotFoundIcon
            />
          {/if}
        </li>
      {/each}
    </ul>
  {/each}
</div>

<div class="flex justify-between mt-8">
  <button class="btn variant-ghost" on:click={() => history.back()} type="button">Cancel</button>

  <button
    class="btn variant-filled-primary"
    disabled={loading || values != null}
    on:click={syncExternalResources}
    type="submit"
  >
    {#if loading}
      <ProgressRadial class="me-2" width="w-4" />
    {/if}

    Sync external resources
  </button>
</div>
