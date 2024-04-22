<script lang="ts">
  import { page } from '$app/stores'
  import { AppBar } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data

  $: basePath = `/areas/${$page.params.slugs}`
</script>

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
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    {#if data.session?.user != null}
      <a class="btn btn-sm variant-ghost" href={`/areas/${$page.params.slugs}/edit`}>
        <i class="fa-solid fa-pen me-2" />Edit area
      </a>
    {/if}
  </svelte:fragment>
</AppBar>

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
  <div class="card-header">Crags</div>

  <section class="p-4">
    {#if data.area.crags.length === 0}
      No crags yet
    {:else}
      <div class="flex flex-wrap gap-2">
        {#each data.area.crags as crag}
          <a class="card card-hover variant-ghost p-4" href={`${basePath}/_/crags/${crag.slug}`}>
            <dt>Name</dt>
            <dd>
              {crag.name}
            </dd>
          </a>
        {/each}
      </div>
    {/if}

    {#if data.session?.user != null}
      <div class="flex justify-center mt-4">
        <a class="btn variant-filled-primary" href={`${basePath}/_/crags/add`}>Add crag</a>
      </div>
    {/if}
  </section>
</div>
