<script lang="ts">
  import { page } from '$app/stores'
  import AscentsTable from '$lib/components/AscentsTable'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
  $: basePath = `/areas/${$page.params.slugs}/_/crags/${$page.params.cragSlug}/boulders/${$page.params.boulderSlug}`
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
          <dd>{data.boulder.author.firstName} {data.boulder.author.lastName}</dd>
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
    <a class="btn btn-sm variant-ghost" href={`${basePath}/edit`}>
      <i class="fa-solid fa-pen me-2" />Edit boulder
    </a>
  </svelte:fragment>
</AppBar>

<div class="card mt-4">
  <div class="card-header">Ascents</div>

  <section class="p-4">
    {#if data.boulder.ascents.length === 0}
      No ascents yet
    {:else}
      <AscentsTable ascents={data.boulder.ascents} />
    {/if}

    <div class="flex justify-center mt-4">
      <a class="btn variant-filled-primary" href={`${basePath}/log`}>Log ascent</a>
    </div>
  </section>
</div>
