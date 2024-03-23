<script lang="ts">
  import { DateTime } from 'luxon'
  import { page } from '$app/stores'
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let data
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <button class="btn" on:click={() => history.back()} type="button">
      <i class="fa-solid fa-arrow-left text-2xl" />
    </button>
  </svelte:fragment>

  {data.crag.name}

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
          <dd>{data.author.firstName} {data.author.lastName}</dd>
        </span>
      </div>
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    <a
      class="btn btn-icon btn-icon-sm variant-ghost"
      href={`/crags/${$page.params.cragId}/edit`}
      use:popup={{
        event: 'hover',
        target: '/crags/:cragId-edit_crag',
        placement: 'bottom-end',
      }}
    >
      <i class="fa-solid fa-pen" />
    </a>

    <a
      class="btn btn-icon btn-icon-sm variant-soft-primary [&>*]:pointer-events-none"
      href="/boulders/add"
      use:popup={{
        event: 'hover',
        target: '/crags/:cragId-add_boulder',
        placement: 'bottom-end',
      }}
    >
      <i class="fa-solid fa-plus" />
    </a>
  </svelte:fragment>

  <div class="card p-4 variant-filled-secondary" data-popup="/crags/:cragId-edit_crag">
    <p>Edit crag</p>
    <div class="arrow variant-filled-secondary" />
  </div>
  <div class="card p-4 variant-filled-secondary" data-popup="/crags/:cragId-add_boulder">
    <p>Add boulder</p>
    <div class="arrow variant-filled-secondary" />
  </div>
</AppBar>

<div class="card mt-4">
  <div class="card-header">Boulders</div>

  <section class="p-4">
    {#if data.boulders.length === 0}
      No boulders yet

      <div class="flex justify-center mt-4">
        <a class="btn variant-filled-primary" href="/boulders/add">Add boulder</a>
      </div>
    {:else}
      <div class="flex gap-2">
        {#each data.boulders as boulder}
          <a class="card card-hover variant-ghost p-4" href={`/boulders/${boulder.id}`}>
            <dt>Name</dt>
            <dd>
              {boulder.name}
              {#if boulder.grade != null}({boulder.gradingScale} {boulder.grade}){/if}
            </dd>
          </a>
        {/each}
      </div>
    {/if}
  </section>
</div>
