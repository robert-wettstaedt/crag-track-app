<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, Pagination } from '@skeletonlabs/skeleton-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Routes - Crag Track</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Routes
  {/snippet}
</AppBar>

<ul class="card mt-8 p-4 preset-filled-surface-100-900">
  {#each data.routes as route (route.id)}
    <li class="hover:preset-tonal-primary flex justify-between">
      <a class="anchor px-4 py-3 grow hover:text-white" href={route.pathname}>
        <RouteName grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} {route} />
      </a>

      <a class="anchor px-4 py-3 hover:text-white" href={route.block.pathname}>
        {route.block.name}
      </a>
    </li>
  {/each}
</ul>

<div class="mt-8 flex justify-end">
  <Pagination
    data={[]}
    count={data.pagination.total}
    pageSize={data.pagination.pageSize}
    page={data.pagination.page}
    onPageChange={(detail) => {
      const url = new URL($page.url)
      url.searchParams.set('page', String(detail.page))
      goto(url)
    }}
  />
</div>
