<script lang="ts">
  import { page } from '$app/stores'
  import FileViewer from '$lib/components/FileViewer'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}`
  $: files = data.files
</script>

<svelte:head>
  <title>{data.area.name} - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">
    {data.area.name}
  </svelte:fragment>

  <svelte:fragment slot="headline">
    <dl class="list-dl">
      <div>
        <span class="flex-auto">
          <dt>Created at</dt>
          <dd>{DateTime.fromSQL(data.area.createdAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Author</dt>
          <dd>{data.area.author.userName}</dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Type</dt>
          <dd>{data.area.type}</dd>
        </span>
      </div>
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    {#if data.area.type === 'crag'}
      <a class="btn btn-sm variant-ghost" href={`${basePath}/export`}>
        <i class="fa-solid fa-file-export me-2" />Export PDF
      </a>
    {/if}

    <a class="btn btn-sm variant-ghost" href={`${basePath}/gpx`} download={`${data.area.name}.gpx`}>
      <i class="fa-solid fa-map-location-dot me-2" />Export GPX
    </a>

    {#if data.area.type === 'crag'}
      <a class="btn btn-sm variant-ghost" href={`${basePath}/edit-parking-location`}>
        <i class="fa-solid fa-parking me-2" />Add parking location
      </a>
    {/if}

    {#if data.session?.user != null}
      <a class="btn btn-sm variant-ghost" href={`${basePath}/sync-external-resources`}>
        <i class="fa-solid fa-sync me-2" />Sync external resources
      </a>

      <a class="btn btn-sm variant-ghost" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen me-2" />Edit area
      </a>
    {/if}
  </svelte:fragment>
</AppBar>

<div class="card mt-4">
  <div class="card-header">Location</div>

  <section class="pt-4">
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

<div class="card mt-4">
  <div class="card-header">Topos</div>

  <section class="p-4">
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

    {#if data.session?.user != null}
      <div class="flex justify-center mt-4">
        <a class="btn variant-filled-primary" href={`${basePath}/add-topo`}> Add topos </a>
      </div>
    {/if}
  </section>
</div>

{#if data.canAddArea || data.area.areas.length > 0}
  <div class="card mt-4">
    <div class="card-header">Areas</div>

    <section class="p-4">
      {#if data.area.areas.length === 0}
        No areas yet
      {:else}
        <div class="flex flex-wrap gap-2">
          {#each data.area.areas as area}
            <a class="card card-hover variant-ghost p-4" href={`${basePath}/${area.slug}-${area.id}`}>
              <dt>Name</dt>
              <dd>
                {area.name}
              </dd>
            </a>
          {/each}
        </div>
      {/if}

      {#if data.session?.user != null && data.canAddArea}
        <div class="flex justify-center mt-4">
          <a class="btn variant-filled-primary" href={`${basePath}/add`}>Add area</a>
        </div>
      {/if}
    </section>
  </div>
{/if}

<div class="card mt-4">
  <div class="card-header">Blocks</div>

  <section class="p-4">
    {#if data.area.blocks.length === 0}
      No blocks yet
    {:else}
      <div class="flex flex-wrap gap-2">
        {#each data.area.blocks as block}
          <a class="card card-hover variant-ghost p-4" href={`${basePath}/_/blocks/${block.slug}`}>
            <dt>Name</dt>
            <dd>
              {block.name}
            </dd>
          </a>
        {/each}
      </div>
    {/if}

    {#if data.session?.user != null}
      <div class="flex justify-center mt-4">
        <a class="btn variant-filled-primary" href={`${basePath}/_/blocks/add`}>Add block</a>
      </div>
    {/if}
  </section>
</div>
