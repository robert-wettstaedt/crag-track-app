<script lang="ts">
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import FileViewer from '$lib/components/FileViewer'
  import type { File } from '$lib/db/schema'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}`
  $: files = data.files

  let highlightedRoutes: number[] = []
  const onMouseEnterFile = (file: File) => () => {
    if (file.routeFk == null) {
      highlightedRoutes = data.crag.routes.map((route) => route.id)
    } else {
      highlightedRoutes = [file.routeFk]
    }
  }
  const onMouseLeaveFile = () => {
    highlightedRoutes = []
  }
</script>

<AppBar>
  <svelte:fragment slot="lead">
    {data.crag.name}
  </svelte:fragment>

  <svelte:fragment slot="headline">
    <dl class="list-dl">
      <div>
        <span class="flex-auto">
          <dt>Created at</dt>
          <dd>{DateTime.fromSQL(data.crag.createdAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Author</dt>
          <dd>{data.crag.author.userName}</dd>
        </span>
      </div>
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    {#if data.session?.user != null}
      <a class="btn btn-sm variant-ghost" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen me-2" />Edit crag
      </a>

      {#if data.crag.lat == null || data.crag.long == null}
        <a class="btn btn-sm variant-ghost" href={`${basePath}/edit-location`}>
          <i class="fa-solid fa-location-dot me-2" />Add geolocation
        </a>
      {/if}
    {/if}
  </svelte:fragment>
</AppBar>

<div class="card mt-4">
  <div class="card-header">Location</div>

  <section class="pt-4">
    {#await import('$lib/components/CragMap') then CragMap}
      {#key data.crag.id}
        <CragMap.default crags={data.crags} height={400} selectedCrag={data.crag} />
      {/key}
    {/await}
  </section>
</div>

<div class="card mt-4">
  <div class="card-header">Topos</div>

  <section class="p-4">
    {#key data.crag.id}
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
                  <RouteName route={data.crag.routes.find((route) => file.routeFk === route.id)} />
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

<div class="card mt-4">
  <div class="card-header">Routes</div>

  <section class="p-4">
    {#if data.crag.routes.length === 0}
      No routes yet
    {:else}
      <nav class="list-nav">
        <ul>
          {#each data.crag.routes as route}
            <li class={highlightedRoutes.includes(route.id) ? 'bg-primary-500/20' : ''}>
              <a class="text-primary-500" href={`${basePath}/routes/${route.slug}`}>
                <RouteName {route} />
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
