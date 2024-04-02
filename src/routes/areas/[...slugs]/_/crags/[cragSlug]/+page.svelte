<script lang="ts">
  import { page } from '$app/stores'
  import BoulderName from '$lib/components/BoulderName'
  import FileViewer from '$lib/components/FileViewer'
  import { AppBar, ProgressRadial } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}`

  $: files = data.files
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
      <CragMap.default crags={data.crags} height={400} selectedCrag={data.crag} />
    {/await}
  </section>
</div>

<div class="card mt-4">
  <div class="card-header">Topos</div>

  <section class="p-4">
    {#await files}
      <div class="flex justify-center">
        <ProgressRadial width="w-16" />
      </div>
    {:then files}
      {#if files.length === 0}
        No topos yet
      {:else}
        <div class="flex flex-wrap gap-3">
          {#each files as file}
            {#if file.error == null}
              <FileViewer
                content={file.content ?? ''}
                file={file.info}
                on:delete={() => {
                  files = files.filter((_file) => file.info.id !== _file.info.id)
                }}
              >
                <BoulderName boulder={data.crag.boulders.find((boulder) => file.info.boulderFk === boulder.id)} />
              </FileViewer>
            {:else}
              <div class="alert variant-filled-error">
                <div class="alert-message">
                  <p>
                    {file.error}
                  </p>

                  <p>
                    {file.info.path}
                  </p>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      {#if data.session?.user != null}
        <div class="flex justify-center mt-4">
          <a class="btn variant-filled-primary" href={`${basePath}/add-topo`}> Add topos </a>
        </div>
      {/if}
    {/await}
  </section>
</div>

<div class="card mt-4">
  <div class="card-header">Boulders</div>

  <section class="p-4">
    {#if data.crag.boulders.length === 0}
      No boulders yet
    {:else}
      <nav class="nav-list">
        <ul>
          {#each data.crag.boulders as boulder}
            <li class="px-4 py-2 hover:bg-primary-500/10 flex justify-between">
              <a class="text-primary-500" href={`${basePath}/boulders/${boulder.slug}`}>
                <BoulderName {boulder} />
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}

    {#if data.session?.user != null}
      <div class="flex justify-center mt-4">
        <a class="btn variant-filled-primary" href={`${basePath}/boulders/add`}>Add boulder</a>
      </div>
    {/if}
  </section>
</div>
