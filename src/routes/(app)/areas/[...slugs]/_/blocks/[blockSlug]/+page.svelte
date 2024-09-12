<script lang="ts">
  import { page } from '$app/stores'
  import FileViewer from '$lib/components/FileViewer'
  import RouteName from '$lib/components/RouteName'
  import TopoViewer, { highlightedRouteStore, selectedRouteStore } from '$lib/components/TopoViewer'
  import type { File } from '$lib/db/schema'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`
  $: files = data.files

  let highlightedRoutes: number[] = []

  const onMouseEnterFile = (file: File) => () => {
    if (file.routeFk == null) {
      highlightedRoutes = data.block.routes.map((route) => route.id)
    } else {
      highlightedRoutes = [file.routeFk]
    }
  }
  const onMouseLeaveFile = () => {
    highlightedRoutes = []
  }
</script>

<svelte:head>
  <title>{data.block.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    {data.block.name}
  </svelte:fragment>

  <svelte:fragment slot="headline">
    <dl class="list-dl">
      <div>
        <span class="flex-auto">
          <dt>Created at</dt>
          <dd>{DateTime.fromSQL(data.block.createdAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Author</dt>
          <dd>{data.block.author.userName}</dd>
        </span>
      </div>
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    {#if data.session?.user != null}
      <a class="btn btn-sm variant-ghost" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen me-2" />Edit block
      </a>

      <a class="btn btn-sm variant-ghost" href={`${basePath}/edit-location`}>
        <i class="fa-solid fa-location-dot me-2" />Edit geolocation
      </a>
    {/if}
  </svelte:fragment>
</AppBar>

<div class="card mt-4">
  <div class="card-header">Location</div>

  <section class="pt-4">
    {#await import('$lib/components/BlocksMap') then BlocksMap}
      {#key data.block.id}
        <BlocksMap.default blocks={data.blocks} height={400} selectedBlock={data.block} />
      {/key}
    {/await}
  </section>
</div>

{#if files.length > 0 || data.topos.length === 0}
  <div class="card mt-4">
    <div class="card-header">Topos</div>

    <section class="p-4">
      {#key data.block.id}
        {#if files.length === 0}
          No topos yet
        {:else}
          <div class="flex flex-wrap gap-3">
            {#each files as file}
              <div class="flex" on:mouseenter={onMouseEnterFile(file)} on:mouseleave={onMouseLeaveFile} role="figure">
                {#if file.stat != null}
                  <FileViewer
                    {file}
                    stat={file.stat}
                    on:delete={() => {
                      files = files.filter((_file) => file.id !== _file.id)
                    }}
                  >
                    <div class="flex justify-between">
                      <div>
                        <RouteName
                          grades={data.grades}
                          gradingScale={data.user?.userSettings?.gradingScale}
                          route={data.block.routes.find((route) => file.routeFk === route.id)}
                        />
                      </div>

                      {#if file.stat.mime?.includes('image')}
                        <a href={`${basePath}/draw-topo/${file.id}`}>
                          <i class="fa-solid fa-marker" />
                          Draw topo
                        </a>
                      {/if}
                    </div>
                  </FileViewer>
                {:else if file.error != null}
                  <aside class="alert variant-filled-error">
                    <div class="alert-message">
                      <h3 class="h3">Error</h3>
                      <p>{file.error}</p>
                    </div>
                  </aside>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {/key}

      {#if data.session?.user != null}
        <div class="flex justify-center mt-4">
          <a class="btn variant-filled-primary" href={`${basePath}/add-topo`}> Add topos </a>
        </div>
      {/if}
    </section>
  </div>
{/if}

<div class="card mt-4">
  <div class="card-header">Routes</div>

  <div class="flex">
    {#if data.topos.length > 0}
      <section class="p-4 w-2/4">
        <div class="relative">
          <TopoViewer topos={data.topos} />

          <a class="btn btn-sm variant-glass-surface absolute bottom-2 right-2 z-30" href={`${basePath}/draw-topo`}>
            <i class="fa-solid fa-pen me-2" />Edit topo
          </a>
        </div>
      </section>
    {/if}

    <section class={`p-4 ${data.topos.length === 0 ? 'w-full' : 'w-2/4'}`}>
      {#if data.block.routes.length === 0}
        No routes yet
      {:else}
        <nav class="list-nav">
          <ul>
            {#each data.block.routes as route}
              <li
                class={[$selectedRouteStore, $highlightedRouteStore, ...highlightedRoutes].includes(route.id)
                  ? 'bg-primary-500/20'
                  : ''}
              >
                <a
                  class="text-primary-500"
                  href={`${basePath}/routes/${route.slug.length === 0 ? route.id : route.slug}`}
                  on:mouseenter={() => highlightedRouteStore.set(route.id)}
                  on:mouseleave={() => highlightedRouteStore.set(null)}
                  on:click={() => selectedRouteStore.set(route.id)}
                  on:keydown={(event) => event.key === 'Enter' && selectedRouteStore.set(route.id)}
                >
                  <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} {route} />
                </a>
              </li>
            {/each}
          </ul>
        </nav>
      {/if}

      {#if data.session?.user != null}
        <div class="flex justify-center mt-4">
          <a class="btn variant-filled-primary" href={`${basePath}/routes/add`}>Add route</a>
        </div>
      {/if}
    </section>
  </div>
</div>
