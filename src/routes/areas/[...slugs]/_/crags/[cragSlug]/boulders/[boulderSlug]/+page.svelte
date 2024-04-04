<script lang="ts">
  import { page } from '$app/stores'
  import AscentsTable from '$lib/components/AscentsTable'
  import BoulderName from '$lib/components/BoulderName'
  import FileViewer from '$lib/components/FileViewer'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}/boulders/${$page.params.boulderSlug}`
  $: files = data.boulder.files
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <BoulderName boulder={data.boulder} />
  </svelte:fragment>

  <svelte:fragment slot="headline">
    <dl class="list-dl">
      <div>
        <span class="flex-auto">
          <dt>Created at</dt>
          <dd>{DateTime.fromSQL(data.boulder.createdAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Author</dt>
          <dd>{data.boulder.author.userName}</dd>
        </span>
      </div>
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    {#if data.session?.user != null}
      <a class="btn btn-sm variant-ghost" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen me-2" />Edit boulder
      </a>
    {/if}
  </svelte:fragment>
</AppBar>

<div class="card mt-4">
  <div class="card-header">Files</div>

  <section class="p-4">
    {#if files.length === 0}
      No files yet
    {:else}
      <div class="flex gap-3">
        {#each files as file}
          <FileViewer
            {file}
            on:delete={() => {
              files = files.filter((_file) => file.id !== _file.id)
            }}
          >
            {#if file.type === 'send'}
              <i class="fa-solid fa-circle text-red-500 me-2" />
            {:else if file.type === 'attempt'}
              <i class="fa-solid fa-person-falling text-blue-300 me-2"></i>
            {:else if file.type === 'beta'}
              Beta
            {:else if file.type === 'topo'}
              Topo
            {:else if file.type === 'other'}
              Other
            {/if}
            &nbsp;
            {file.ascent == null ? '' : DateTime.fromSQL(file.ascent.createdAt).toLocaleString(DateTime.DATE_FULL)}
          </FileViewer>
        {/each}
      </div>
    {/if}

    {#if data.session?.user != null}
      <div class="flex justify-center mt-4">
        <a class="btn variant-filled-primary" href={`${basePath}/add-file`}>Add file</a>
      </div>
    {/if}
  </section>
</div>

<div class="card mt-4">
  <div class="card-header">Ascents</div>

  <section class="p-4">
    {#if data.boulder.ascents.length === 0}
      No ascents yet
    {:else}
      <AscentsTable ascents={data.boulder.ascents} />
    {/if}

    {#if data.session?.user != null}
      <div class="flex justify-center mt-4">
        <a class="btn variant-filled-primary" href={`${basePath}/log`}>Log ascent</a>
      </div>
    {/if}
  </section>
</div>
