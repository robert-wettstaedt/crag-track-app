<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Areas - Crag Track</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Areas
  {/snippet}

  {#snippet trail()}
    {#if data.session?.user != null}
      <a class="btn btn-sm preset-filled-primary-500" href="/areas/add">
        <i class="fa-solid fa-plus"></i> Add area
      </a>
    {/if}
  {/snippet}
</AppBar>

<div class="block card p-4 mt-8 preset-filled-surface-100-900">
  {#if data.areas.length === 0}
    No areas yet
  {:else}
    <nav class="list-nav">
      <ul>
        {#each data.areas as area}
          <li>
            <a class="flex px-4 py-2 hover:preset-filled-primary-100-900" href={`/areas/${area.slug}-${area.id}`}>
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
