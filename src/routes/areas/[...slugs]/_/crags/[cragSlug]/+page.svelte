<script lang="ts">
  import { page } from '$app/stores'
  import BoulderName from '$lib/components/BoulderName'
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

      <div>
        <span class="flex-auto">
          <dt>Author</dt>
          <dd>{data.crag.author.userName}</dd>
        </span>
      </div>
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

    <div class="flex justify-center mt-4">
      <a class="btn variant-filled-primary" href={`${basePath}/boulders/add`}>Add boulder</a>
    </div>
  </section>
</div>
