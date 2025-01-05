<script lang="ts">
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import { EDIT_PERMISSION } from '$lib/auth.js'
  import AppBar from '$lib/components/AppBar'
  import FileViewer from '$lib/components/FileViewer'
  import GenericList from '$lib/components/GenericList'
  import GradeHistogram from '$lib/components/GradeHistogram'
  import References from '$lib/components/References'
  import { convertException } from '$lib/errors'
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte'
  import { DateTime } from 'luxon'

  let { data } = $props()
  let basePath = $derived(`/areas/${$page.params.slugs}`)
  let files = $state(data.files)

  let loadingDownload = $state(false)
  let downloadError: string | null = $state(null)

  const onDownloadGpx = async () => {
    loadingDownload = true
    downloadError = null

    try {
      const res = await fetch(`${basePath}/gpx`)

      if (!res.ok || res.status >= 400) {
        throw new Error(res.statusText)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${data.area.name}.gpx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (exception) {
      downloadError = convertException(exception)
    }

    loadingDownload = false
  }
</script>

<svelte:head>
  <title>{data.area.name} - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

{#if downloadError}
  <aside class="card preset-tonal-warning my-8 p-2 md:p-4 whitespace-pre-line">
    <p>{downloadError}</p>
  </aside>
{/if}

<AppBar>
  {#snippet lead()}
    {data.area.name}
  {/snippet}

  {#snippet headline()}
    <dl>
      {#if data.area.description != null && data.area.description.length > 0}
        <div class="flex p-2">
          <span class="flex-auto">
            <dt>Description</dt>
            <dd>
              <div class="rendered-markdown mt-4">
                {@html data.area.description}
              </div>
            </dd>
          </span>
        </div>
      {/if}

      <div class="flex p-2">
        <span class="flex-auto">
          <dt>Created at</dt>
          <dd>{DateTime.fromSQL(data.area.createdAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
        </span>
      </div>

      <div class="flex p-2">
        <span class="flex-auto">
          <dt>Author</dt>
          <dd>
            <a class="anchor" href="/users/{data.area.author.username}">
              {data.area.author.username}
            </a>
          </dd>
        </span>
      </div>

      <div class="flex p-2">
        <span class="flex-auto">
          <dt>Type</dt>
          <dd>{data.area.type}</dd>
        </span>
      </div>
    </dl>
  {/snippet}

  {#snippet actions()}
    {#if data.area.type === 'crag'}
      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/export`}>
        <i class="fa-solid fa-file-export"></i>Export PDF
      </a>
    {/if}

    <button class="btn btn-sm preset-outlined-primary-500" disabled={loadingDownload} onclick={onDownloadGpx}>
      {#if loadingDownload}
        <span>
          <ProgressRing size="size-4" value={null} />
        </span>
      {:else}
        <i class="fa-solid fa-map-location-dot"></i>
      {/if}

      Export GPX
    </button>

    {#if data.userPermissions?.includes(EDIT_PERMISSION)}
      {#if data.area.type !== 'area'}
        <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/edit-parking-location`}>
          <i class="fa-solid fa-parking"></i>Add parking location
        </a>
      {/if}

      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/sync-external-resources`}>
        <i class="fa-solid fa-sync"></i>Sync external resources
      </a>

      <a class="btn btn-sm preset-outlined-primary-500" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen"></i>Edit area
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
      {#key data.area.id}
        <BlocksMap.default
          blocks={data.blocks}
          height={400}
          parkingLocations={data.area.parkingLocations}
          selectedArea={data.area}
        />
      {/key}
    {/await}
  </section>
</div>

<div class="card mt-4 p-2 md:p-4 preset-filled-surface-100-900">
  <div class="card-header" id="topos">Topos</div>

  <section class="p-2 md:p-4">
    {#key data.area.id}
      {#if files.length === 0}
        No topos yet
      {:else}
        <div class="flex flex-wrap gap-3">
          {#each files as file}
            <div class="flex" role="figure">
              {#if file.stat != null}
                <FileViewer
                  {file}
                  readOnly={!data.userPermissions?.includes(EDIT_PERMISSION) &&
                    data.area.author.authUserFk !== data.authUser?.id}
                  stat={file.stat}
                  on:delete={() => {
                    files = files.filter((_file) => file.id !== _file.id)
                  }}
                />
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

{#if data.canAddArea || data.area.areas.length > 0}
  <div class="card mt-4 p-2 md:p-4 preset-filled-surface-100-900">
    <div class="card-header" id="areas">Areas</div>

    <section class="py-2 md:py-4">
      {#if data.area.areas.length === 0}
        No areas yet
      {:else}
        <GenericList
          items={data.area.areas.map((item) => ({ ...item, pathname: `${basePath}/${item.slug}-${item.id}` }))}
          wrap={false}
        >
          {#snippet left(item)}
            {item.name}
          {/snippet}

          {#snippet right(item)}
            <div class="flex items-center">
              {item.numOfRoutes}

              {#if item.numOfRoutes === 1}
                route
              {:else}
                routes
              {/if}
            </div>

            <GradeHistogram
              axes={false}
              data={item.grades}
              spec={{
                width: 100,
              }}
              opts={{
                height: 38,
              }}
            />
          {/snippet}
        </GenericList>
      {/if}

      {#if data.userPermissions?.includes(EDIT_PERMISSION) && data.canAddArea}
        <div class="flex justify-center mt-4">
          <a class="btn preset-filled-primary-500" href={`${basePath}/add`}>Add area</a>
        </div>
      {/if}
    </section>
  </div>
{/if}

<div class="card mt-4 p-2 md:p-4 preset-filled-surface-100-900">
  <div class="card-header" id="blocks">Blocks</div>

  <section class="py-2 md:py-4">
    {#if data.area.blocks.length === 0}
      No blocks yet
    {:else}
      <GenericList
        items={data.area.blocks.map((item) => ({ ...item, pathname: `${basePath}/_/blocks/${item.slug}` }))}
        wrap={false}
      >
        {#snippet left(item)}
          {item.name}
        {/snippet}

        {#snippet right(item)}
          <div class="flex items-center">
            {item.numOfRoutes}

            {#if item.numOfRoutes === 1}
              route
            {:else}
              routes
            {/if}
          </div>

          <GradeHistogram
            axes={false}
            data={item.grades}
            spec={{
              width: 100,
            }}
            opts={{
              height: 38,
            }}
          />
        {/snippet}
      </GenericList>
    {/if}

    {#if data.userPermissions?.includes(EDIT_PERMISSION)}
      <div class="flex justify-center mt-4">
        <a class="btn preset-filled-primary-500" href={`${basePath}/_/blocks/add`}>Add block</a>
      </div>
    {/if}
  </section>
</div>
