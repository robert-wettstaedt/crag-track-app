<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
  import AppBar from '$lib/components/AppBar'
  import GenericList from '$lib/components/GenericList'
  import RouteName from '$lib/components/RouteName'
  import type { EnrichedBlock } from '$lib/db/utils'
  import { Pagination } from '@skeletonlabs/skeleton-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Routes - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Routes
  {/snippet}
</AppBar>

<div class="card mt-8 p-2 md:p-4 preset-filled-surface-100-900">
  <GenericList
    items={data.routes}
    rightContent={(item) => item.block.name}
    rightPathname={(item) => (item.block as EnrichedBlock).pathname}
  >
    {#snippet left(item)}
      <RouteName route={item} />
    {/snippet}
  </GenericList>
</div>

<div class="my-8 flex justify-end">
  <Pagination
    buttonClasses="btn-sm md:btn-md"
    count={data.pagination.total}
    data={[]}
    page={data.pagination.page}
    pageSize={data.pagination.pageSize}
    siblingCount={0}
    onPageChange={(detail) => {
      const url = new URL($page.url)
      url.searchParams.set('page', String(detail.page))
      goto(url)
    }}
  />
</div>
