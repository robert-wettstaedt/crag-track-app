<script lang="ts">
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let data
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <br />
  </svelte:fragment>

  Boulders

  <svelte:fragment slot="trail">
    <a
      class="btn btn-icon btn-icon-sm variant-soft-primary [&>*]:pointer-events-none"
      href="/boulders/add"
      use:popup={{
        event: 'hover',
        target: '/boulders/:boulderId-add_boulder',
        placement: 'bottom-end',
      }}
    >
      <i class="fa-solid fa-plus" />
    </a>
  </svelte:fragment>

  <div class="card p-4 variant-filled-secondary" data-popup="/boulders/:boulderId-add_boulder">
    <p>Add boulder</p>
    <div class="arrow variant-filled-secondary" />
  </div>
</AppBar>

{#if data.boulders.length > 0}
  <div class="block card p-4 mt-8">
    <nav class="list-nav">
      <ul>
        {#each data.boulders as boulder}
          <li>
            <a href={`/boulders/${boulder.id}`}>
              <span class="flex-auto">
                {boulder.name}
                {#if boulder.grade != null}({boulder.gradingScale} {boulder.grade}){/if}
              </span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
{/if}
