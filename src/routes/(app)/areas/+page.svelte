<script lang="ts">
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import { EDIT_PERMISSION } from '$lib/auth.js'
  import GenericList from '$lib/components/GenericList'
  import { AppBar } from '@skeletonlabs/skeleton-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Areas - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Areas
  {/snippet}

  {#snippet trail()}
    {#if data.userPermissions?.includes(EDIT_PERMISSION)}
      <a class="btn btn-sm preset-filled-primary-500" href="/areas/add">
        <i class="fa-solid fa-plus"></i> Add area
      </a>
    {/if}
  {/snippet}
</AppBar>

<div class="block card p-2 md:p-4 mt-8 preset-filled-surface-100-900">
  {#if data.areas.length === 0}
    No areas yet
  {:else}
    <GenericList items={data.areas.map((item) => ({ ...item, pathname: `/areas/${item.slug}-${item.id}` }))}>
      {#snippet left(item)}
        {item.name}
      {/snippet}
    </GenericList>
  {/if}
</div>
