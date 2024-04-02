<script lang="ts">
  import { page } from '$app/stores'
  import AscentsTable from '$lib/components/AscentsTable'
  import FileViewer from '$lib/components/FileViewer'
  import { AppBar, ProgressRadial } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}/boulders/${$page.params.boulderSlug}`
  $: files = data.files
</script>

<AppBar>
  <svelte:fragment slot="lead">
    {data.boulder.name}
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

      <div>
        <span class="flex-auto">
          <dt>Grade</dt>
          <dd>
            {#if data.boulder.grade == null}
              n/A
            {:else}
              {data.boulder.gradingScale} {data.boulder.grade}
            {/if}
          </dd>
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
    {#await files}
      <div class="flex justify-center">
        <ProgressRadial width="w-16" />
      </div>
    {:then files}
      {#if files.length === 0}
        No files yet
      {:else}
        <div class="flex gap-3">
          {#each files as file}
            {#if file.error == null}
              <FileViewer
                content={file.content ?? ''}
                file={file.info}
                on:delete={() => {
                  files = files.filter((_file) => file.info.id !== _file.info.id)
                }}
              >
                {#if file.info.type === 'send'}
                  <i class="fa-solid fa-circle text-red-500 me-2" />
                {:else if file.info.type === 'attempt'}
                  <i class="fa-solid fa-person-falling text-blue-300 me-2"></i>
                {:else if file.info.type === 'beta'}
                  Beta
                {:else if file.info.type === 'topo'}
                  Topo
                {:else if file.info.type === 'other'}
                  Other
                {/if}
                &nbsp;
                {file.info.ascent == null
                  ? ''
                  : DateTime.fromSQL(file.info.ascent.createdAt).toLocaleString(DateTime.DATE_FULL)}
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
          <a class="btn variant-filled-primary" href={`${basePath}/add-file`}>Add file</a>
        </div>
      {/if}
    {/await}
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
