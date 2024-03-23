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

  {data.boulder.name}

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
          <dd>{data.author.firstName} {data.author.lastName}</dd>
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

      <div>
        <a href={`/crags/${data.crag.id}`}>
          <span class="flex-auto">
            <dt><i class="fa-solid fa-link me-2" />Crag</dt>
            <dd>
              {data.crag.name}
            </dd>
          </span>
        </a>
      </div>
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    <a
      class="btn btn-icon btn-icon-sm variant-ghost"
      href={`/boulders/${$page.params.boulderId}/edit`}
      use:popup={{
        event: 'hover',
        target: '/boulders/:boulderId-edit_boulder',
        placement: 'bottom-end',
      }}
    >
      <i class="fa-solid fa-pen" />
    </a>

    <a
      class="btn btn-icon btn-icon-sm variant-soft-primary [&>*]:pointer-events-none"
      href={`/boulders/${$page.params.boulderId}/log`}
      use:popup={{
        event: 'hover',
        target: '/boulders/:boulderId-add_ascent',
        placement: 'bottom-end',
      }}
    >
      <i class="fa-solid fa-check-double" />
    </a>
  </svelte:fragment>

  <div class="card p-4 variant-filled-secondary" data-popup="/boulders/:boulderId-edit_boulder">
    <p>Edit boulder</p>
    <div class="arrow variant-filled-secondary" />
  </div>
  <div class="card p-4 variant-filled-secondary" data-popup="/boulders/:boulderId-add_ascent">
    <p>Log ascent</p>
    <div class="arrow variant-filled-secondary" />
  </div>
</AppBar>

<h3 class="h3 mt-8">Ascents</h3>
<div class="card p-6 mt-8">
  {#if data.ascents.length === 0}
    No ascents yet

    <div class="flex justify-center mt-4">
      <a class="btn variant-filled-primary" href={`/boulders/${$page.params.boulderId}/log`}>Log ascent</a>
    </div>
  {:else}
    Hello
  {/if}
</div>
