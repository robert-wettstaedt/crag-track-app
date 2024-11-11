<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import AscentsTable from '$lib/components/AscentsTable'
  import { AppBar, Pagination } from '@skeletonlabs/skeleton-svelte'

  let { data } = $props()

  console.log(data)
</script>

<svelte:head>
  <title>Ascents - Crag Track</title>
</svelte:head>

<AppBar>
  {#snippet lead()}
    Ascents
  {/snippet}
</AppBar>

<div class="card mt-8 p-4 preset-filled-surface-100-900">
  <AscentsTable ascents={data.ascents} grades={data.grades} gradingScale={data.user?.userSettings?.gradingScale} />
</div>

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
