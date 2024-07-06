<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import RouteName from '$lib/components/RouteName'
  import { AppBar, Paginator } from '@skeletonlabs/skeleton'

  export let data

  const onPageChange = ({ detail }: CustomEvent<number>) => {
    const url = new URL($page.url)
    url.searchParams.set('page', String(detail))
    goto(url)
  }
</script>

<AppBar>
  <svelte:fragment slot="lead">Routes</svelte:fragment>
</AppBar>

<ul class="list mt-8">
  {#each data.routes as route}
    <li class="px-4 py-2 hover:bg-primary-500/10 flex justify-between">
      <a class="text-primary-500" href={route.pathname}>
        <RouteName {route} />
      </a>

      <a class="text-primary-500" href={route.block.area.pathname}>
        {route.block.area.name}
      </a>
    </li>
  {/each}
</ul>

<div class="mt-8 flex justify-end">
  <Paginator
    settings={{
      amounts: [],
      limit: data.pagination.pageSize,
      page: data.pagination.page,
      size: data.pagination.total,
    }}
    on:page={onPageChange}
  />
</div>
