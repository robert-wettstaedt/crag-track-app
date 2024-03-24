<script lang="ts">
  import { page } from '$app/stores'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}`
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

      {#if data.author != null}
        <div>
          <span class="flex-auto">
            <dt>Author</dt>
            <dd>{data.author.firstName} {data.author.lastName}</dd>
          </span>
        </div>
      {/if}
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    <a class="btn btn-sm variant-ghost" href={`${basePath}/edit`}>
      <i class="fa-solid fa-pen me-2" />Edit crag
    </a>
  </svelte:fragment>
</AppBar>

<div class="card mt-4">
  <div class="card-header">Boulders</div>

  <section class="p-4">
    {#if data.boulders.length === 0}
      No boulders yet
    {:else}
      <div class="flex gap-2">
        {#each data.boulders as boulder}
          <a class="card card-hover variant-ghost p-4" href={`${basePath}/boulders/${boulder.slug}`}>
            <dt>Name</dt>
            <dd>
              {boulder.name}
              {#if boulder.grade != null}({boulder.gradingScale} {boulder.grade}){/if}
            </dd>
          </a>
        {/each}
      </div>
    {/if}

    <div class="flex justify-center mt-4">
      <a class="btn variant-filled-primary" href={`${basePath}/boulders/add`}>Add boulder</a>
    </div>
  </section>
</div>
