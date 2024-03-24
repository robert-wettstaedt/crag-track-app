<script lang="ts">
  import { AppBar, popup } from '@skeletonlabs/skeleton'

  export let data
</script>

<AppBar>
  <svelte:fragment slot="lead">Areas</svelte:fragment>

  <svelte:fragment slot="trail">
    <a class="btn btn-sm variant-soft-primary" href="/areas/add">
      <i class="fa-solid fa-plus me-2" /> Add area
    </a>
  </svelte:fragment>
</AppBar>

<div class="block card p-4 mt-8">
  {#if data.areas.length === 0}
    No areas yet
  {:else}
    <nav class="list-nav">
      <ul>
        {#each data.areas as area}
          <li>
            <a href={`/areas/${area.slug}`}>
              <span class="flex-auto">
                {area.name}
              </span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</div>
