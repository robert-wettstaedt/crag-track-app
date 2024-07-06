<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton'

  export let data
</script>

<svelte:head>
  <title>Areas - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">Areas</svelte:fragment>

  <svelte:fragment slot="trail">
    {#if data.session?.user != null}
      <a class="btn btn-sm variant-soft-primary" href="/areas/add">
        <i class="fa-solid fa-plus me-2" /> Add area
      </a>
    {/if}
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
            <a href={`/areas/${area.slug}-${area.id}`}>
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
