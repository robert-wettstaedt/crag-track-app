<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import AscentsTable from '$lib/components/AscentsTable'
  import { AppBar, Paginator } from '@skeletonlabs/skeleton'

  export let data

  const onPageChange = ({ detail }: CustomEvent<number>) => {
    const url = new URL($page.url)
    url.searchParams.set('page', String(detail))
    goto(url)
  }
</script>

<svelte:head>
  <title>Ascents - Crag Track</title>
</svelte:head>

<AppBar>
  <svelte:fragment slot="lead">Ascents</svelte:fragment>
</AppBar>

<AscentsTable ascents={data.ascents} />

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
