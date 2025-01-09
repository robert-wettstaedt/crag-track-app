<script lang="ts">
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import { EDIT_PERMISSION } from '$lib/auth'
  import AppBar from '$lib/components/AppBar'
  import FileViewer from '$lib/components/FileViewer'
  import References from '$lib/components/References'
  import RouteName from '$lib/components/RouteName'
  import TopoViewer, { highlightedRouteStore, selectedRouteStore } from '$lib/components/TopoViewer'
  import type { File } from '$lib/db/schema'
  import { DateTime } from 'luxon'

  let { data } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}`)
  let files = $state(data.files)

  let highlightedRoutes: number[] = $state([])

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
  <title>{data.block.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    {data.block.name}
  {/snippet}

  {#snippet headline()}
    <dl>
      <div class="flex p-2">
        <span class="flex-auto">
          <dt>Created at</dt>
          <dd>{DateTime.fromSQL(data.block.createdAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
        </span>
      </div>

      <div class="flex p-2">
        <span class="flex-auto">
          <dt>Author</dt>
          <dd>
            <a class="anchor" href="/users/{data.block.author.username}">
              {data.block.author.username}
            </a>
          </dd>
        </span>
      </div>
    </dl>
  {/snippet}

  {#snippet actions()}
    <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/export`}>
      <i class="fa-solid fa-file-export"></i>Export block preview
    </a>

    {#if data.userPermissions?.includes(EDIT_PERMISSION)}
      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen"></i>Edit block
      </a>

      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/edit-location`}>
        <i class="fa-solid fa-location-dot"></i>Edit geolocation
      </a>
    {/if}
  {/snippet}
</AppBar>

{#await data.references then references}
  {#if references.routes.length > 0}
    <div class="card mt-4 p-2 md:p-4 preset-filled-surface-100-900">
      <div class="card-header">Mentioned in</div>

      <References {references} />
    </div>
  {/if}
{/await}

<div class="card mt-4 p-2 md:p-4 preset-filled-surface-100-900">
  <div class="card-header" id="location">Location</div>

  <section class="pt-4 min-h-[400px]">
    {#await import('$lib/components/BlocksMap') then BlocksMap}
      {#key data.block.id}
        <BlocksMap.default blocks={data.blocks} height={400} selectedBlock={data.block} />
      {/key}
    {/await}
  </section>
</div>

{#if files.length > 0 || data.topos.length === 0}
  <div class="card mt-4 p-2 md:p-4 preset-filled-surface-100-900">
    <div class="card-header" id="topos">Topos</div>

    <section class="p-2 md:p-4">
      {#key data.block.id}
        {#if files.length === 0}
          No topos yet
        {:else}
          <div class="flex flex-wrap gap-3">
            {#each files as file}
              <div class="flex" onmouseenter={onMouseEnterFile(file)} onmouseleave={onMouseLeaveFile} role="figure">
                {#if file.stat != null}
                  <FileViewer
                    {file}
                    readOnly={!data.userPermissions?.includes(EDIT_PERMISSION) &&
                      data.block.author.authUserFk !== data.authUser?.id}
                    stat={file.stat}
                    on:delete={() => {
                      files = files.filter((_file) => file.id !== _file.id)
                    }}
                  >
                    <div class="flex justify-between">
                      <div>
                        <RouteName route={data.block.routes.find((route) => file.routeFk === route.id)} />
                      </div>

                      {#if file.stat.mime?.includes('image')}
                        <a href={`${basePath}/draw-topo/${file.id}`}>
                          <i class="fa-solid fa-marker"></i>
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

      {#if data.userPermissions?.includes(EDIT_PERMISSION)}
        <div class="flex justify-center mt-4">
          <a class="btn preset-filled-primary-500" href={`${basePath}/add-topo`}> Add topos </a>
        </div>
      {/if}
    </section>
  </div>
{/if}

<div class="card mt-4 p-2 md:p-4 preset-filled-surface-100-900">
  <div class="card-header" id="routes">Routes</div>

  <div class="flex flex-wrap">
    {#if data.topos.length > 0}
      <section class="md:p-4 w-full md:w-2/4">
        <div class="relative">
          <TopoViewer topos={data.topos}>
            {#snippet actions()}
              {#if data.userPermissions?.includes(EDIT_PERMISSION)}
                <a aria-label="Edit topo" class="btn-icon preset-filled" href={`${basePath}/draw-topo`}>
                  <i class="fa-solid fa-pen"></i>
                </a>
              {/if}
            {/snippet}
          </TopoViewer>
        </div>
      </section>
    {/if}

    <section class={`md:p-4 w-full ${data.topos.length === 0 ? '' : 'md:w-2/4'}`}>
      {#if data.block.routes.length === 0}
        No routes yet
      {:else}
        <nav class="list-nav">
          <ul>
            {#each data.block.routes as route}
              <li
                class={`px-4 py-2 whitespace-nowrap ${
                  [$selectedRouteStore, $highlightedRouteStore, ...highlightedRoutes].includes(route.id)
                    ? 'preset-filled-primary-100-900'
                    : ''
                }`}
              >
                <a
                  class={[$selectedRouteStore, $highlightedRouteStore, ...highlightedRoutes].includes(route.id)
                    ? 'text-white'
                    : 'text-primary-500'}
                  href={`${basePath}/routes/${route.slug.length === 0 ? route.id : route.slug}`}
                  onmouseenter={() => highlightedRouteStore.set(route.id)}
                  onmouseleave={() => highlightedRouteStore.set(null)}
                  onclick={() => selectedRouteStore.set(route.id)}
                  onkeydown={(event) => event.key === 'Enter' && selectedRouteStore.set(route.id)}
                >
                  <RouteName {route} />
                </a>
              </li>
            {/each}
          </ul>
        </nav>
      {/if}

      {#if data.userPermissions?.includes(EDIT_PERMISSION)}
        <div class="flex justify-center mt-4">
          <a class="btn preset-filled-primary-500" href={`${basePath}/routes/add`}>Add route</a>
        </div>
      {/if}
    </section>
  </div>
</div>
