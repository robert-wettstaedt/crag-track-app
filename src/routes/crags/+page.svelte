<script lang="ts">
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let data
</script>

<AppBar>
  <svelte:fragment slot="lead"><br /></svelte:fragment>

  Crags

  <svelte:fragment slot="trail">
    <a
      class="btn btn-icon btn-icon-sm variant-soft-primary [&>*]:pointer-events-none"
      href="/crags/add"
      use:popup={{
        event: 'hover',
        target: '/crags-add_crag',
        placement: 'bottom-end',
      }}
    >
      <i class="fa-solid fa-plus" />
    </a>
  </svelte:fragment>

  <div class="card p-4 variant-filled-secondary" data-popup="/crags-add_crag">
    <p>Add crag</p>
    <div class="arrow variant-filled-secondary" />
  </div>
</AppBar>

<div class="block card p-4 mt-8">
  {#if data.crags.length === 0}
    No crags yet
  {:else}
    <nav class="list-nav">
      <ul>
        {#each data.crags as crag}
          <li>
            <a href={`/crags/${crag.id}`}>
              <span class="flex-auto">
                {crag.name}
              </span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</div>
