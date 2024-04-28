<script lang="ts">
  import { page } from '$app/stores'
  import AscentTypeLabel from '$lib/components/AscentTypeLabel'
  import RouteName from '$lib/components/RouteName'
  import FileViewer from '$lib/components/FileViewer'
  import { Accordion, AccordionItem, AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/blocks/${$page.params.blockSlug}/routes/${$page.params.routeSlug}`
  $: files = data.files
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <RouteName route={data.route} />
  </svelte:fragment>

  <svelte:fragment slot="headline">
    <dl class="list-dl">
      <div>
        <span class="flex-auto">
          <dt>Created at</dt>
          <dd>{DateTime.fromSQL(data.route.createdAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Author</dt>
          <dd>
            <a class="anchor" href={`/users/${data.route.author.userName}`}>
              {data.route.author.userName}
            </a>
          </dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>FA</dt>
          <dd class="flex justify-between items-center">
            <span>
              {#if data.route.firstAscent?.climber != null}
                <a class="anchor" href={`/users/${data.route.firstAscent.climber.userName}`}>
                  {data.route.firstAscent.climber.userName}
                </a>

                &nbsp;
              {:else if data.route.firstAscent?.climberName != null}
                {data.route.firstAscent.climberName}

                &nbsp;
              {/if}

              {data.route.firstAscent?.year ?? ''}
            </span>

            {#if data.session?.user != null}
              <a class="btn btn-sm variant-ghost ms-4" href={`${basePath}/edit-first-ascent`}>
                <i class="fa-solid fa-pen me-2" />Edit FA
              </a>
            {/if}
          </dd>
        </span>
      </div>
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    {#if data.session?.user != null}
      <a class="btn btn-sm variant-ghost" href={`${basePath}/edit`}>
        <i class="fa-solid fa-pen me-2" />Edit route
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
      <div class="flex flex-wrap gap-3">
        {#each files as file}
          {#if file.stat != null}
            <FileViewer
              {file}
              stat={file.stat}
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
            </FileViewer>
          {:else if file.error != null}
            <aside class="alert variant-filled-error">
              <div class="alert-message">
                <h3 class="h3">Error</h3>
                <p>{file.error}</p>
              </div>
            </aside>
          {/if}
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
    {#if data.ascents.length === 0}
      No ascents yet
    {:else}
      {#each data.ascents as ascent, index}
        <div>
          <div class="flex justify-between">
            <span>
              <a class="anchor" href={`/users/${ascent.author.userName}`}>{ascent.author.userName}</a>
              ticked this route on {DateTime.fromSQL(ascent.dateTime).toLocaleString(DateTime.DATE_FULL)}
            </span>

            {#if data.session?.user?.email === ascent.author.email}
              <a class="btn btn-sm variant-ghost" href={`${basePath}/ascents/${ascent.id}/edit`}>
                <i class="fa-solid fa-pen me-2" />Edit ascent
              </a>
            {/if}
          </div>

          <div class="ms-8 mt-2">
            <AscentTypeLabel type={ascent.type} />

            {#if ascent.grade != null}
              <RouteName route={data.route} {ascent} />
            {/if}
          </div>

          {#if ascent.notes != null && ascent.notes.length > 0}
            <div class="rendered-markdown bg-surface-700 p-4 ms-8 mt-4">
              {@html ascent.notes}
            </div>
          {/if}

          {#if ascent.files.length > 0}
            <div class="ms-5 mt-4">
              <Accordion>
                <AccordionItem>
                  <svelte:fragment slot="lead"><i class="fa-solid fa-file" /></svelte:fragment>
                  <svelte:fragment slot="summary">{ascent.files.length} files</svelte:fragment>
                  <svelte:fragment slot="content">
                    <div class="flex flex-wrap gap-3">
                      {#each ascent.files as file}
                        {#if file.stat != null}
                          <FileViewer
                            {file}
                            stat={file.stat}
                            on:delete={() => {
                              ascent.files = ascent.files.filter((_file) => file.id !== _file.id)
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
                      {/each}
                    </div>
                  </svelte:fragment>
                </AccordionItem>
              </Accordion>
            </div>
          {/if}
        </div>

        {#if index < data.ascents.length - 1}
          <hr class="!border-t-2 my-8 mx-2" />
        {/if}
      {/each}
    {/if}

    {#if data.session?.user != null}
      <div class="flex justify-center mt-4">
        <a class="btn variant-filled-primary" href={`${basePath}/ascents/add`}>Log ascent</a>
      </div>
    {/if}
  </section>
</div>
